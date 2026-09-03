// key is hidden in github, although there needs to be a more secure way of storing
const key = require('./api-key.js');

const api_key = key.get_api_key();


const base_GET_url = 'https://instructure.charlotte.edu/api/';

async function get_user_courses() {
  const response = await fetch(`${base_GET_url}v1/courses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${api_key}`
    }
  });

  // 1. Verify the request succeeded before trying to parse JSON
  if (!response.ok) {
    // Read as plain text so it doesn't crash on HTML error pages
    const errorText = await response.text();
    console.error(`API Request Failed: ${response.status} ${response.statusText}`);
    console.error(`Details: ${errorText}`);
    return;
  }

  // 2. Safe to parse now
  const json = await response.json();
  console.log(json);
  
  return json;
}module.exports = {get_user_courses};
