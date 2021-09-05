// global variable for db connection
let db;

// establish the connection to indexedDb called 'ddd', set version to 1
const request = indexedDB.open('ddd', 1);

// event trigger to db version changes
request.onupgradeneeded = function (e) {
    // save a reference to the db
    const db = e.target.result;

    // create an object store (table) called 'new_budget', set an auto-incrementing pk
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// on success
request.onsuccess = function (e) {
    // when db is successfully created with the new object store
    db = e.target.result;

    // check if app is online, if yes run uploadBudget()
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function (e) {
    console.log(e.target.errorCode)
};

// execute when no connection exists
function saveRecord(record) {
    // open new transaction with rw perms
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store for 'new_budget'
    const budgetObjectStore = transaction.objectStore('new_budget');

    // add record to your store with add method
    budgetObjectStore.add(record);
};

function uploadBudget() {
    // open a transaction on the db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there is data in db store, send it via api
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                      throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_budget'], 'readwrite');
                    // access the new_budget object store
                    const budgetObjectStore = transaction.objectStore('new_budget');
                    // clear all items in the store
                    budgetObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
};

// listen for app coming back online
window.addEventListener('online', uploadBudget);

