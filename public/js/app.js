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
                { title: 'Job Location Address', field: 'locationAddress' },
                { title: 'Total Cost', field: 'cost' },
                { title: 'Customer ID', field: 'customerId' },
                { title: 'Customer Name', field: 'name' },
                { title: 'Customer Address', field: 'customerAddress' }


            ] //create columns from data field names
        });


    // #endregion
});

document.getElementById('login-button').addEventListener('click', () => {
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

document.getElementById('fetch').addEventListener('click', () => {
    // #region user clicks Get button

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const tenantID = document.getElementById('tenant-id').value;


    const data = { startDate, endDate, tenantID };

    // Show loading spinner
    document.getElementById('loading-spinner').style.display = 'block';

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

            // Fetch customer name, address, job location, and total data for each job from the invoices endpoint
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
                        const name = job.invoice.customer.name // Set name to the name form customer object in invoice
                        job.name = name // Add name to the job object
                        const customerAddress = job.invoice.customerAddress // Set custAddress to the customer address in invoice
                        job.customerAddress = `${customerAddress.street}, ${customerAddress.city}, ${customerAddress.state}, ${customerAddress.zip}` // Add the formatted customer address to the job object
                        const address = job.invoice.locationAddress // Set address to the locationAddress object from the invoice
                        job.locationAddress = `${address.street}, ${address.city}, ${address.state}, ${address.zip}`; // Add formatted address to the job object
                        return job;
                    });
            });

            // Wait for all invoice data to be fetched
            const jobsWithInvoiceData = await Promise.all(invoicePromises);
            //console.log(jobsWithInvoiceData);

            // Put data into table
            table.setData(jobsWithInvoiceData);

            // Hide loading spinner
            document.getElementById('loading-spinner').style.display = 'none';
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            // Hide loading spinner
            document.getElementById('loading-spinner').style.display = 'none';
        });
    // #endregion
});