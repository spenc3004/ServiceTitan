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
    table = new Tabulator('#table',
        {
            pagination: 'local',
            paginationSize: 15,
            columns: [
                { title: 'Job ID', field: 'id' },
                { title: 'Job Status', field: 'jobStatus' },
                { title: 'Completed Date', field: 'completedOn' },
                { title: 'Customer ID', field: 'customerId' },
                { title: 'Customer Name', field: 'name', width: 150 },
                { title: 'Customer Address', field: 'customerAddress' },
                {
                    title: 'Job Location Address', field: 'locationAddress'
                }

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
        .then(async jobsData => {
            const jobsArray = jobsData.data
            // Fetch location data for each job
            const locationPromises = jobsArray.map(job => {
                return fetch('/locations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ locationId: job.locationId, tenantID })
                })
                    .then(response => response.json())
                    .then(locationData => {
                        job.locationData = locationData.data; // Add location data to the job object
                        const location = locationData.data.find(loc => loc.id === job.locationId);
                        if (location && location.address) {
                            const address = location.address;
                            job.locationAddress = `${address.street}, ${address.city}, ${address.state}, ${address.zip}`; // Add formatted address to the job object
                        } else {
                            job.locationAddress = 'N/A';
                        }
                        return job;
                    });
            });
            // Wait for all location data to be fetched
            const jobsWithLocationData = await Promise.all(locationPromises);

            // Fetch customer data for each job
            const customerPromises = jobsWithLocationData.map(job => {
                return fetch('/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ customerId: job.customerId, tenantID })
                })
                    .then(response => response.json())
                    .then(customerData => {
                        job.customerData = customerData.data; // Add customer data to the job object
                        const name = customerData.data.name;
                        job.name = name; // Add customer name to the job object
                        const address = customerData.data.address;
                        job.customerAddress = `${address.street}, ${address.city}, ${address.state}, ${address.zip}`; // Add formatted address to the job object
                        return job;
                    }
                    );
            });

            // Wait for all customer data to be fetched
            const jobsWithCustomerData = await Promise.all(customerPromises);
            console.log(jobsWithCustomerData);
            // Put data into table
            table.setData(jobsWithCustomerData);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
    // #endregion
});