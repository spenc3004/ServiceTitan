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
                { title: 'Job Location Street', field: 'locationStreet' },
                { title: 'Job Location City', field: 'locationCity' },
                { title: 'Job Location State', field: 'locationState' },
                { title: 'Job Location Zip', field: 'locationZip' },
                { title: 'Total Cost', field: 'cost' },
                { title: 'Customer ID', field: 'customerId' },
                { title: 'Customer Name', field: 'name' },
                { title: 'Customer Type', field: 'customerType' },
                { title: 'Customer Street', field: 'customerStreet' },
                { title: 'Customer City', field: 'customerCity' },
                { title: 'Customer State', field: 'customerState' },
                { title: 'Customer Zip', field: 'customerZip' },
                { title: 'Do Not Mail', field: 'doNotMail' }


            ] //create columns from data field names
        });



    // Fetch the membeship type names
    const tenantID = document.getElementById('tenant-id').value;
    fetch('/membershipTypes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tenantID })
    })
        .then(response => response.json())
        .then(async membershipTypesData => {
            const membershipsData = membershipTypesData.data
            const selectElement = document.getElementById('memberships-select');

            // Clear existing options (if any)
            selectElement.innerHTML = "";

            // Push the mebership type names into the options of the multi-select
            membershipsData.forEach(membership => {
                const option = document.createElement("option");
                option.textContent = membership.name; // Display name
                option.value = membership.id || membership.name; // Each option must have a value otherwise you get an error when deselecting an option (won't let you deselect because something in the nice-select2.js file in then undefined) and when selecting it says the option isn't found and asks if it has a value (still lets you select it but puts the error in the console)
                selectElement.appendChild(option); // Add the option to the multi-select
            });

            NiceSelect.bind(selectElement); // Initialize the NiceSelect on the multi-select
            document.getElementById('memberships').style.display = 'block'; // Show multi-select now that it has retrieved the data
        })

    // Trigger download
    document.getElementById('download-csv').addEventListener('click', function () {
        table.download('csv', 'data.csv');
    });
    document.getElementById('download-csv').disabled = true


    // #endregion
});

document.getElementById('login-btn').addEventListener('click', () => {
    // #region user clicks Login button
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

document.getElementById('fetch-btn').addEventListener('click', () => {
    // #region user clicks Get button

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const tenantID = document.getElementById('tenant-id').value;


    const data = { startDate, endDate, tenantID };

    // Show loading spinner
    document.getElementById('loading-spinner').style.display = 'flex';

    // Fetch job data from jobs endpoint
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

            // Fetch customer name, address, job location, and total cost data for each job from the invoices endpoint
            const invoicePromises = jobsArray.map(job => {
                return fetch('/invoices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ invoiceId: job.invoiceId, tenantID })
                })
                    .then(response => response.json())
                    .then(invoiceData => {
                        job.invoice = invoiceData.data[0] // Add the invoice object to the job object
                        job.cost = job.invoice.total; // Add invoice total to the job object
                        job.name = job.invoice.customer.name // Set and add name from invoice data to the job object
                        const customerAddress = job.invoice.customerAddress // Set customerAddress to the customer address in invoice
                        // Add address fields for customer to job object
                        job.customerStreet = customerAddress.street
                        job.customerCity = customerAddress.city
                        job.customerState = customerAddress.state
                        job.customerZip = customerAddress.zip
                        const address = job.invoice.locationAddress // Set address to the locationAddress object from the invoice
                        // Add location address fields to job location
                        job.locationStreet = address.street
                        job.locationCity = address.city
                        job.locationState = address.state
                        job.locationZip = address.zip
                        return job;
                    });
            });

            // Wait for all invoice data to be fetched
            const jobsWithInvoiceData = await Promise.all(invoicePromises);

            // Fetch customer type and do not mail
            const customerPromises = jobsWithInvoiceData.map(job => {
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
                        job.customerType = customerData.data.type // Set and add customer type to job object
                        job.doNotMail = customerData.data.doNotMail // Set and add if the customeris on the do not mail list to the job object
                        return job;
                    });
            });

            // Wait for all customer data to be fetched
            const jobsWithCustomerData = await Promise.all(customerPromises);
            console.log(jobsWithCustomerData)

            // Fetch customer memberhip data
            const membershipPromises = jobsWithCustomerData.map(job => {
                return fetch('/memberships', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ customerId: job.customerId, tenantID })
                })
                    .then(response => response.json())
                    .then(membershipData => {
                        job.membershipData = membershipData.data
                        return job;
                    });
            });


            // Put data into table
            table.setData(jobsWithCustomerData);

            // Hide loading spinner
            document.getElementById('loading-spinner').style.display = 'none';
            document.getElementById('download-csv').disabled = false
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            // Hide loading spinner
            document.getElementById('loading-spinner').style.display = 'none';
            //document.getElementById('download-csv').style.display = 'block';
        });
    // #endregion
});

document.getElementById('filter-btn').addEventListener('click', () => {
    // #region user clicks Filter button
    console.log("Filtering...")



    // #endregion
})