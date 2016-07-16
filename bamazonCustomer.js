var prompt = require('prompt');
var mysql = require('mysql');
var clear = require('clear');
var inquirer = require('inquirer');
var Table = require('cli-table');
var colors = require('colors/safe');

var dispayTable = "";

//connect to the MySQL database named "bamazon"
//with password hard coded to ""
var connection = mysql.createConnection({
     host: 'localhost',
     port: 3306,
     user: 'root',
     password: '',
     database: "bamazon"
    });

    connection.connect(function(err) {
     if (err) throw err;
     //console.log("connected as id " + connection.threadId);
    });

//first show the customer what is in stock
function displayInventory(askToQuitFlag){
    if(askToQuitFlag>0){
        inquirer.prompt([{
            name: "quit",
            type: "input",
            message: "Please enter Y if you want to continue?"
            }]).then(function(continueFlag){
                if (continueFlag.quit.toLowerCase() === "y") {
                    displayInventory(0); //call it again without the asy to quit flag set
                }else{
                    console.log('You have sucessfully quit the Bamazon Application')
                    process.exit(0);
                }
            })
    }else{
    connection.query('SELECT * FROM products', function(err, inventory) {
            if (err) throw err;
            console.log("Check out the Amazing Bamazon Inventory list");
            var table = new Table({
                    head: ['Item ID', 'Product', 'Department', 'Price', 'Quantity\nAvailable'],
                    colWidths: [12,32,22,10,13]
                });
            var chooserArray = [];
            for(var i = 0; i < inventory.length; i++) {
                if (inventory[i].StockQuantity > 0 ) { //if we still have stock add the item to the table
                    chooserArray.push(inventory[i].ItemID);
                    table.push([inventory[i].ItemID, inventory[i].ProductName, inventory[i].DepartmentName, inventory[i].Price,inventory[i].StockQuantity]);
                }
            }
            if (chooserArray.length<1) {
                console.log("It appears we have nothing left to sell, so we either are really rich or went bankrupt!")
            }
            dispayTable = table.toString();
            console.log(dispayTable);
            console.log(chooserArray);

            inquirer.prompt([{
                name: "id",
                type: "input",
                message: "Please enter the item ID number of the item you would like to buy?",
                validate: function(input){
                    //input is a string and not a number use parseInt to fix it
                    var aNum = chooserArray.indexOf(parseInt(input));
                    if (aNum >= 0) {
                        return true
                    }else{
                        var message = 'your choice must be a valid item ID #\n these are the valid item ID numbers\n'+ chooserArray
                        return message
                    }
                }
            },{
                type: "input",
                message: "How many would you like to buy?",
                name: "quantity",
                validate: function(input){
                    var qtyNum = parseInt(input);
                    var isItAnum = /^\d+$/.test(qtyNum);
                    if (isItAnum === true) {
                        return isItAnum;
                    }else{
                        var message = colors.red("please  enter a valid number")
                        return message;
                    }
                }
            }]).then(function(enteredData){
                clear();
                var itemNum = parseInt(enteredData.id);
                var itemQty = parseInt(enteredData.quantity);
                connection.query('SELECT * FROM products WHERE itemID = '+itemNum, function(err, itemInfo) {
                    if (err) throw err;
                    if (itemQty <= itemInfo[0].StockQuantity) { //are there enough in stock to cover this order?
                        console.log('\n\nThe item you have choosen is '+itemInfo[0].ProductName +'\nThe quantity ordered is '+itemQty);
                        console.log('The total price for this order will be $'+(itemInfo[0].Price * itemQty));
                        inquirer.prompt([{
                            name: "decide",
                            type: "input",
                            message: colors.blue("\n\nDo you want to proceed to checkout?")+colors.green("\nType Y to checkout")+colors.red("\nType N to start over")+colors.blue("\nType Q to Quit")
                            }]).then(function(checkout){
                                if (checkout.decide.toLowerCase() === "y") {
                                    console.log(colors.green('Your credit card will be charged $'+(itemInfo[0].Price * itemQty)));
                                    console.log(colors.green("Your shipment will ship very soon"));
                                    var newStockQty = parseInt(itemInfo[0].StockQuantity)-parseInt(itemQty)
                                    connection.query('UPDATE products SET StockQuantity='+newStockQty+' WHERE itemID = '+itemNum);
                                    displayInventory(1);
                                }else if (checkout.decide.toLowerCase() === "n") {//start over
                                    displayInventory(1);
                                }
                                else{
                                    console.log('You have sucessfully quit the Bamazon Application')
                                    process.exit(0);
                                }
                            })
                    }else{//not enough stock to cover this order
                        console.log(colors.red('Unfortunately at this time we do have enough stock on hand to fulfill this order'));
                        console.log('The item you have choosen is '+itemInfo[0].ProductName +'\nThe quantity ordered is '+itemQty)
                        console.log('We only have '+itemInfo[0].StockQuantity +' on hand. ');
                        inquirer.prompt([{
                            name: "qty",
                            type: "input",
                            message: "How many would you like to order  (enter 0 to start over)",
                            validate: function(input){
                                var qtyNum = parseInt(input);
                                var isItAnum = /^\d+$/.test(qtyNum);
                                if (isItAnum === true) {
                                    return isItAnum;
                                }else{
                                    var message = colors.red("please  enter a valid number")
                                    return message;
                                }
                            }
                        }]).then(function(newQty){
                            var newItemQty = parseInt(newQty.qty);
                            if ( newItemQty === 0) {
                                displayInventory(1);
                            }else if (newItemQty <= itemInfo[0].StockQuantity ) { //are there enough in stock to cover this order?
                                console.log('\n\nThe item you have choosen is '+itemInfo[0].ProductName +'\nThe quantity ordered is '+newItemQty);
                                console.log('The total price for this order will be $'+(itemInfo[0].Price * newItemQty).toFixed(2));
                                inquirer.prompt([{
                                    name: "decide",
                                    type: "input",
                                    message: colors.blue("\n\nDo you want to proceed to checkout?")+colors.green("\nType Y to checkout")+colors.red("\nType N to start over")+colors.blue("\nType Q to Quit")
                                }]).then(function(checkout){
                                    if (checkout.decide.toLowerCase() === "y") {
                                        console.log(colors.green('Your credit card will be charged $'+(itemInfo[0].Price * newItemQty)));
                                        console.log(colors.green("Your shipment will ship very soon"));
                                        var newStockQty = parseInt(itemInfo[0].StockQuantity)-parseInt(newItemQty)
                                        connection.query('UPDATE products SET StockQuantity='+newStockQty+' WHERE itemID = '+itemNum);
                                        displayInventory(1);
                                    }else if (checkout.decide.toLowerCase() === "n") {//start over
                                        displayInventory(1);
                                    }else{
                                        console.log('You have sucessfully quit the Bamazon Application')
                                        process.exit(0);
                                    }
                                })
                            }
                        })
                    }
                })
            });
        })
    }
}



// get everything started witn no prompt if you want to continue
displayInventory(0);