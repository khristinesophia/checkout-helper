const express = require('express')
const app = express()

const path = require('path')
global.__basedir = __dirname


//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))


const methodOverride = require('method-override')
const session = require('express-session')

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(methodOverride('_method'))
// app.use(session({
//     secret: 'abcd123456789',
//     resave: false,
//     saveUninitialized: true
// }))


// set pug as view engine
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// routes
const transactions = require('./routes/transactions')

// register routes as middleware
app.use('/transactions', transactions)


app.get('/', async (req, res)=>{
    const q1result = await pool.query(`
        SELECT * FROM hotels
    `)
    const q2result = await pool.query(`
        SELECT * 
        FROM guestaccounts t1
        JOIN guestaccounts_guestdetails t2
            ON t1.accountid = t2.accountid
        JOIN folios t3
            ON t1.accountid = t3.accountid
    `)

    res.render('landing', {
        hotelsArray: q1result.rows,
        gaArray: q2result.rows
    })
})


const PORT = 5500
app.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`)
})
