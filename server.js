const express = require('express');
const app = express();
const PORT = 3000;
require('dotenv').config();
const appKey = process.env.APP_KEY;
console.log(process.env.APP_KEY);

app.use(express.static('public'));
app.use(express.json()); //middleware to pull json out of the request


app.post('/login', async (req, res) => {
    // #region POST /login
    const clientId = req.body.clientId;
    const clientSecret = req.body.clientSecret;

    const url = "https://auth-integration.servicetitan.io/connect/token";
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
    });

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
    });

    let data = await response.json();

    if (!data.access_token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }


    res.cookie('access_token', data.access_token, {
        httpOnly: true,
        maxAge: data.expires_in * 1000
    });

    res.status(200).json({ message: 'Success' });
    // #endregion
}
);

app.get('/authenticate', (req, res) => {
    // #region GET /authenticate
    const accessToken = req.headers.cookie;
    if (!accessToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    res.json({ message: 'Success' });
    // #endregion
});

app.post('/jobs', async (req, res) => {
    // #region POST /jobs
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const tenantID = req.body.tenantID;
    const accessToken = req.headers.cookie.split('=')[1];

    const url = `https://api-integration.servicetitan.io/jpm/v2/tenant/${tenantID}/jobs?jobStatus=Completed`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': accessToken,
            'ST-App-Key': appKey

        }
    })

    if (response.status === 401) {
        console.log('There was a problem');
        console.log(response);
    }
    const data = await response.json();
    // console.log(data);


    res.json(data);
    // #endregion
});




app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

