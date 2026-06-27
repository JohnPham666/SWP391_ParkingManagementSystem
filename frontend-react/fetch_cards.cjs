const axios = require('axios');
async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'tuan.staff@parking.vn',
            password: 'password'
        });
        const token = loginRes.data.data.token;
        const res = await axios.get('http://localhost:8080/api/cards', {
            headers: { Authorization: 'Bearer ' + token }
        });
        console.log('Success:', res.data.success);
        console.log('Total cards:', res.data.data.length);
        console.log('First card:', res.data.data[0]);
    } catch(e) {
        console.error('Error Data:', e.response ? e.response.data : e.message);
    }
}
test();
