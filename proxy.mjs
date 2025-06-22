import express from 'express'
import fetch from 'node-fetch'
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import fs from 'fs';

let imagesJSON = JSON.parse("{}")

const app = express()

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

// app.get('/api/fms', async (req, res) => {
//   if ( token == "" ){
//     try {
//       const response = await fetch('https://fms.goidea.pl/fmi/data/v1/databases/GoogleDrive/sessions', {
//         method: "POST",
//         headers: {
//           "Authorization": "Basic QVBJOmFwaSEy",
//           "Content-Type": "application/json"
//         }
//       });
//       const data = await response.text(); // lub .json() jeśli to JSON
//       token = JSON.parse(data).response.token
//       res.send(token);
//     } catch (error) {
//       console.error('Błąd proxy:', error);
//       res.status(500).send('Błąd proxy');
//     }
    
//   }else{
//     res.send(token)
//   }

// });

app.get('/restaurants', async (req, res) => {
  
  let tokenRequest = await fetch('https://fms.goidea.pl/fmi/data/v1/databases/GoogleDrive/sessions', {
    method: "POST",
    headers: {
      "Authorization": "Basic QVBJOmFwaSEy",
      "Content-Type": "application/json"
    }
  });

  let tokenResponse = await tokenRequest.text(); 
  let token = JSON.parse(tokenResponse).response.token
  
  try{
  
    const restaurantsRequest = await fetch('https://fms.goidea.pl/fmi/data/v1/databases/GoogleDrive/layouts/Restaurants/records?script=getAllRestaurants', {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    })
    
    const restaurantsResponse = await restaurantsRequest.text()
    res.send(restaurantsResponse)
  }catch(error){
      console.error('Błąd proxy:', error);
      res.status(500).send('Błąd proxy');
  }


})

app.get('/picture/:id', async (req, res) => {
  const recid = req.params.id

  let tokenRequest = await fetch('https://fms.goidea.pl/fmi/data/v1/databases/GoogleDrive/sessions', {
    method: "POST",
    headers: {
      "Authorization": "Basic QVBJOmFwaSEy",
      "Content-Type": "application/json"
    }
  });

  let tokenResponse = await tokenRequest.text(); 
  let token = JSON.parse(tokenResponse).response.token

  const recjson = await getrec ( 'https://fms.goidea.pl/fmi/data/v1/databases/GoogleDrive/layouts/Restaurants/records/'+recid ,token)

  const imgUrl = JSON.parse(recjson).response.data[0].fieldData.Picture

  const imageBuffer = await fetchImageWithAuth(imgUrl, token)

  const base64 = imageBuffer.toString('base64')
  
  res.json({base64})
})

app.get('/restaurant/:id', async (req, res) => {
  const recid = req.params.id

  let tokenRequest = await fetch('https://fms.goidea.pl/fmi/data/v1/databases/GoogleDrive/sessions', {
    method: "POST",
    headers: {
      "Authorization": "Basic QVBJOmFwaSEy",
      "Content-Type": "application/json"
    }
  });

  let tokenResponse = await tokenRequest.text(); 
  let token = JSON.parse(tokenResponse).response.token

   try{
  
    const restaurantsRequest = await fetch('https://fms.goidea.pl/fmi/data/v1/databases/GoogleDrive/layouts/Restaurants/records?script=getMenu&script.param='+recid, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    })
    
    const restaurantsResponse = await restaurantsRequest.json()
    res.send(restaurantsResponse)
  }catch(error){
      console.error('Błąd proxy:', error);
      res.status(500).send('Błąd proxy');
  }

})


app.listen(3001, () => {
  console.log('Proxy działa na http://localhost:3001');
});


let getrec = async (url, token) => {

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    return await response.text();

  } catch (error) {
    console.error("Błąd pobierania koktajli:", error.message);
    return {};
  }
}

async function fetchImageWithAuth(url, token) {
  try {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar }));

    const response = await client.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'image/*',
      },
      responseType: 'arraybuffer',
      validateStatus: status => status >= 200 && status < 300
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('Błąd pobierania obrazka:', error.message);
    return null;
  }
}
