var prompt = require('prompt');
//var inquirer = require('inquirer');
var mysql = require('mysql');
//var colors = require('colors');
var clear = require('clear');
var inquirer = require('inquirer');
var Table = require('cli-table');


prompt.get(['password'], function(err, result) {
    var connection = mysql.createConnection({
     host: 'localhost',
     port: 3306,
     user: 'root',
     password: result.password,
     database: "bamazon"
    });
    clear();
    connection.connect(function(err) {
     if (err) throw err;
     console.log("connected as id " + connection.threadId);
    });
    function displayInventory(){
        connection.query('SELECT * FROM products', function(err, inventory) {
                if (err) throw err;
                console.log("Check out the Amazing Bamazon Inventory list");
                var table = new Table({
                        head: ['Item ID', 'Product', 'Department', 'Price', 'Quantity'],
                        colWidths: [4,50,50,8, 6]
                    });
                for(var i = 0; i < inventory.length; i++) {
                    table.push([inventory[i].ItemID, inventory[i].ProductName, inventory[i].DepartmentName, inventory[i].Price,inventory[i].StockQuantity]);
                }
                console.log(table.toString());
        })

    }
displayInventory()
});

