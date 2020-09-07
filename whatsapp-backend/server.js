// Importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';

// App Config
const app = express();
const port = process.env.PORT || 9000 ;

const pusher = new Pusher({
    appId: '1068243',
    key: 'd24ab3c7fd17318987c1',
    secret: '666ce40600f90f02cac6',
    cluster: 'eu',
    encrypted: true
  });

// Middleware
app.use(express.json());

app.use((req, res, next) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});


// DB Config
const connectionURL = 'mongodb+srv://admin:J8XY21FaDJ22x255@cluster0.nu2eo.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connectionURL,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
} ,() => {console.log("Connected Successfully to the database")});


// ??
const db = mongoose.connection;
db.once('open', () => {
    console.log('DB Connected');
    const msgCollection = db.collection('messagecontents');
    const changedStream = msgCollection.watch();

    changedStream.on('change', (change) => {
        console.log(change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message, 
                timestamp:messageDetails.timestamp
            });
        } else {
            console.log('Error trigerring pusher');
        }
    });
});
// API route
app.get('/', (req, res) => res.status(200).send('Hello World'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});
app.post('messages/new', (req, res) => {

    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});




// Listen

app.listen(port, () => console.log(`Listening on Localhost:${port}`));