const fs = require('fs');

const sql = fs.readFileSync('Database_PostgreLatest.sql', 'utf-8');
const lines = sql.split('\n');

let newLines = [];
let inCards = false;
let inSessions = false;
let sessionCardIdx = 1;
let cardStatuses = {};

for (let i = 1; i <= 150; i++) {
    cardStatuses[String(i).padStart(3, '0')] = 'ACTIVE';
}
cardStatuses['LOST-01'] = 'LOST';
cardStatuses['LOST-02'] = 'LOST';

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('INSERT INTO ParkingCards')) {
        inCards = true;
        newLines.push(line);
        continue;
    }

    if (inCards) {
        if (line.includes(';')) {
            inCards = false;
            newLines.push('__CARDS_PLACEHOLDER__');
        }
        continue;
    }

    if (line.includes('INSERT INTO ParkingSessions')) {
        inSessions = true;
        newLines.push(line);
        continue;
    }

    if (inSessions) {
        if (line.trim() === '' || line.startsWith('--')) {
            inSessions = false;
            newLines.push(line);
            continue;
        }

        const match = line.match(/^\((\d+),\s*(\d+),\s*(\d+),\s*([^,]+),\s*(.*)/);
        if (match) {
            const sess_id = match[1];
            const veh_id = match[2];
            const slot_id = match[3];
            const old_card = match[4];
            const rest = match[5];

            const cardId = String(sessionCardIdx).padStart(3, '0');
            sessionCardIdx++;

            if (rest.includes("'PARKING'") || rest.includes("'UNPAID'") || rest.includes("'VIOLATION'")) {
                cardStatuses[cardId] = 'IN_USE';
            } else if (rest.includes("'LOST_TICKET'")) {
                cardStatuses[cardId] = 'LOST';
            } else {
                // COMPLETED or others -> ACTIVE
                cardStatuses[cardId] = 'ACTIVE';
            }

            let newLine = (, , , '', ;
            newLines.push(newLine);
            
            if (rest.includes(';')) {
                inSessions = false;
            }
            continue;
        }
    }

    newLines.push(line);
}

let cardsStrList = [];
for (const [cid, status] of Object.entries(cardStatuses)) {
    cardsStrList.push(('', ''));
}
const cardsStr = cardsStrList.join(',\n') + ';';

const finalLines = newLines.map(line => line === '__CARDS_PLACEHOLDER__' ? cardsStr : line);
fs.writeFileSync('Database_PostgreLatest.sql', finalLines.join('\n'), 'utf-8');
console.log('Updated SQL. Total sessions:', sessionCardIdx - 1);
