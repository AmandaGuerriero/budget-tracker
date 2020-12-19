const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;


let db;

const request = indexedDB.open('budget_tracker', 1);

// Upgrade if needed
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('new_item', { autoIncrement: true });
};

// If successful
request.onsuccess = function(event) {
  db = event.target.result;
  
  // If online, uploadTransactions
  if (navigator.onLine) {
    uploadTransactions();
  }
};
  
request.onerror = function(event) {
  // Log if error
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['new_item'], 'readwrite');
  const itemObjectStore = transaction.objectStore('new_item');

  // Add item to store
  itemObjectStore.add(record);
}

function uploadTransactions() {
  const transaction = db.transaction(['new_item'], 'readwrite');
  const itemObjectStore = transaction.objectStore('new_item');

  // Get all stored records
  const getAll = itemObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
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
        const transaction = db.transaction(['new_item'], 'readwrite');
        // access the new_item object store
        const itemObjectStore = transaction.objectStore('new_item');
        // clear all items in your store
        itemObjectStore.clear();

        alert('All saved transactions has been submitted!');
      })
      .catch(err => {
        console.log(err);
      });
    }
  };
}

function deletePending() {
  const transaction = db.transaction(['new_item'], "readwrite");
  const itemObjectStore = transaction.objectStore("new_item");
  itemObjectStore.clear();
}

window.addEventListener("online", uploadTransactions);