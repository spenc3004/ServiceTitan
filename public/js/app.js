console.log('Hello from app.js');
let table;

/**
 * Shows or hides the login page
 * @param {boolean} visible - Show or hide the login page
 */

function setLogin(visible) {
    // #region Show/Hide Login
    const login = document.getElementById('login-area');
    const app = document.getElementById('app-area');
    if (visible) {
        login.style.display = 'block';
        app.style.display = 'none';
    } else {
        login.style.display = 'none';
        app.style.display = 'block';
    }
    // #endregion
}

document.addEventListener('DOMContentLoaded', () => {
    // #region page loaded

    fetch('/authenticate').then(response => {
        if (response.status === 401) {
            console.log('Not authenticated');
            setLogin(true);
        } else {
            console.log('Authenticated');
            setLogin(false);
        }
    });


    //initialize table
    table = new Tabulator('#table', {
        columns: [
            { title: 'Job ID', field: 'id', width: 150 },
            { title: 'Job Status', field: 'jobStatus', width: 150 },
            { title: 'Completed Date', field: 'completedOn', width: 150 },


        ] //create columns from data field names
    });


    // #endregion
});

document.getElementById('login-button').addEventListener('click', () => {
    // #region user clicks Login button
    console.log('Button clicked');

    const clientId = document.getElementById('client-id').value;
    const clientSecret = document.getElementById('client-secret').value;

    const data = { clientId, clientSecret };

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.status === 401) {
                console.log('Unauthorized');
                setLogin(true);
                return;
            }
            setLogin(false);
            response.json()
        })
        .then(data => {
            console.log(data);
        });

    // #endregion
}
);

document.getElementById('fetch').addEventListener('click', () => {
    // #region user clicks Get button
    console.log('Button clicked');

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const tenantID = document.getElementById('tenant-id').value;

    const data = { startDate, endDate, tenantID };

    fetch('/jobs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            table.setData(data.data);
        });
    // #endregion
});
