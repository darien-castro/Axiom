// key is hidden in github, although there needs to be a more secure way of storing
const key = require('./api-key.js');

const api_key = key.get_api_key();


// base url for calls
const base_GET_url = 'https://instructure.charlotte.edu/api/v1/';

// gathering information from api
async function get_user_courses() {
  const response = await fetch(`${base_GET_url}courses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${api_key}`
    }
  });

  // error checking
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Request Failed: ${response.status} ${response.statusText}`);
    console.error(`Details: ${errorText}`);
    return;
  }

  const json = await response.json();

  const dataset = [];

  // only returning course names, not any other data!
  for (const course of json){
    dataset.push(`${course.name}`);
  };
  return dataset;
}

// export function
module.exports = {get_user_courses};
