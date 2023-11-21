//- path import
const path = require('path')

//- express and router
const express = require('express')
const router = express.Router()

//- pool import
const pool = require(path.join(__basedir, 'config', 'db-config'))

//- /transactions/anc
router.post('/anc', async (req,res)=>{
    try {
        const { hotelid, accountid, folioid } = req.body

        const q1result = await pool.query(`
           INSERT INTO ancillary_transactions(ps_id, quantity, amount, accountid, hotelid, paid, folioid)
           VALUES ($1, $2, $3, $4, $5, false, $6),
               ($7, $8, $9, $10, $11, false, $12),
               ($13, $14, $15, $16, $17, false, $18),
               ($19, $20, $21, $22, $23, false, $24),
               ($25, $26, $27, $28, $29, false, $30)
       `, [ 15, 1, 1200, accountid, hotelid, folioid,
             19, 1, 1000, accountid, hotelid, folioid,
             21, 2, 800, accountid, hotelid, folioid,
             24, 1, 500, accountid, hotelid, folioid,
             26, 5, 2000, accountid, hotelid, folioid
       ])

        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
    
})

//- /transactions/hsk
router.post('/hsk', async (req,res)=>{
    try {
        const { hotelid, accountid, folioid, roomid } = req.body

        const q1result = await pool.query(`
            INSERT INTO housekeeping_transactions (roomid, ref_itemid, price, qty, accountid, hotelid, amount, paid, folioid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9),
                    ($10, $11, $12, $13, $14, $15, $16, $17, $18),
                    ($19, $20, $21, $22, $23, $24, $25, $26, $27)
        `, [ roomid, 5, 75.00, 1, accountid, hotelid, 75.00, false, folioid,
            roomid, 2, 160.00, 1, accountid, hotelid, 160.00, false, folioid,
            roomid, 1, 35.00, 2, accountid, hotelid, 70.00, false, folioid
        ])

        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
    
})

//- /transactions/toinspected
router.post('/toinspected', async (req,res)=>{
    try {
        const { hotelid, accountid} = req.body

        const q1result = await pool.query(`
            UPDATE rooms t1
            SET status = $1 
            FROM guestaccounts t2
            WHERE 
                t1.roomid = t2.roomid AND
                t2.hotelid = $2 AND 
                t2.accountid = $3
        `, ['Inspected', hotelid, accountid])

        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
    
})

//- /transactions/tovacant
router.post('/tovacant', async (req,res)=>{
    try {
        const { hotelid, accountid} = req.body

        const q1result = await pool.query(`
            UPDATE rooms t1
            SET status = $1 
            FROM guestaccounts t2
            WHERE 
                t1.roomid = t2.roomid AND
                t2.hotelid = $2 AND 
                t2.accountid = $3
        `, ['Vacant', hotelid, accountid])

        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
    
})

module.exports = router