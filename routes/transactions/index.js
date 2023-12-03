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
        // const { hotelid, accountid } = req.body
        const hotelID = req.body.hotelid
        const id = req.body.accountid




        //- room status "Recently Checked-Out" to "Vacant"
        const q9result = await pool.query(`
            UPDATE rooms t1
            SET status = $1 
            FROM guestaccounts t2
            WHERE 
                t1.roomid = t2.roomid AND
                t2.hotelid = $2 AND 
                t2.accountid = $3
        `, ['Vacant', hotelID, id])




        //- get ga record
        const q1 = `
            SELECT * FROM guestaccounts t1
            JOIN guestaccounts_guestdetails t2
                ON t1.accountid = t2.accountid
            JOIN folios t3
                ON t1.accountid = t3.accountid
            JOIN room_type t4
                ON t1.typeid = t4.typeid
            JOIN rooms t5
                ON t1.roomid = t5.roomid
            WHERE t1.hotelid = $1 AND
                t1.accountid = $2
        `
        const q1result = await pool.query(q1, [hotelID, id])

        //- destructure
        const { accountid, hotelid, roomtype, roomnum, adultno, childno, 
            reservationdate, checkindate, checkoutdate, numofdays, 
            modeofpayment, promocode, 
            fullname, email, contactno, address,
            folioid, subtotal, discount, tax, totalamount, paid, balance, settled } = q1result.rows[0]

        //- insert into hist_guestaccounts
        const q2 = `
            INSERT INTO hist_guestaccounts(accountid, hotelid, roomtype, roomnum, adultno, childno, 
                reservationdate, checkindate, checkoutdate, numofdays, 
                modeofpayment, promocode, settled)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `
        const q2result = await pool.query(q2, [accountid, hotelid, roomtype, roomnum, adultno, childno, 
            reservationdate, checkindate, checkoutdate, numofdays, 
            modeofpayment, promocode, settled])

        //- insert into hist_guestaccounts_guestdetails
        const q3 = `
            INSERT INTO hist_guestaccounts_guestdetails(accountid, hotelid, fullname, email, contactno, address)
            VALUES($1, $2, $3, $4, $5, $6)
        `
        const q3result = await pool.query(q3, [accountid, hotelid, fullname, email, contactno, address])

        //- insert into hist_folio
        const q4 = `
            INSERT INTO hist_folios(folioid, accountid, hotelid, subtotal, discount, tax, totalamount, paid, balance, settled)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `
        const q4result = await pool.query(q4, [folioid, accountid, hotelid, subtotal, discount, tax, totalamount, paid, balance, settled])




        //- get t record (fds)
        const q5 = `
            SELECT * 
            FROM transactions t1
            JOIN rooms t2
                ON t1.roomid = t2.roomid
            WHERE t1.accountid = $1 AND
                t1.hotelid = $2
        `
        const q5result = await pool.query(q5, [id, hotelID])
        const t_fds = q5result.rows

        //- insert into hist_transactions
        t_fds.forEach(async (t) => {
            await pool.query(`INSERT INTO hist_transactions(transactionid, hotelid, accountid, roomnum, 
                            description, price, qty, amount, date, 
                            approvalcode, paid, folioid)
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [t.transactionid, t.hotelid, t.accountid, t.roomnum, 
                    t.description, t.price, t.qty, t.amount, t.date, 
                    t.approvalcode, t.paid, t.folioid]
            )
        })



        //- get t record (anc)
        const q6 = `
            SELECT * 
            FROM ancillary_transactions
            WHERE accountid = $1 AND
                hotelid = $2
        `
        const q6result = await pool.query(q6, [id, hotelID])
        const t_anc = q6result.rows

        //- insert into hist_ancillary_transactions
        t_anc.forEach(async (t) => {
            await pool.query(`INSERT INTO hist_ancillary_transactions(transaction_id, transaction_date, ps_id, 
                            quantity, amount, employeeid, archived_date, 
                            accountid, hotelid, approvalcode, paid, folioid)
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [t.transaction_id, t.transaction_date, t.ps_id, 
                t.quantity, t.amount, t.employeeid, t.archived_date, 
                t.accountid, t.hotelid, t.approvalcode, t.paid, t.folioid])
        })



        //- get t record (hsk)
        const q7 = `
            SELECT * 
            FROM housekeeping_transactions t1
            JOIN rooms t2
                ON t1.roomid = t2.roomid
            WHERE t1.accountid = $1 AND
                t1.hotelid = $2
        `
        const q7result = await pool.query(q7, [id, hotelID])
        const t_hsk = q7result.rows

        //- insert into hist_housekeeping_transactions
        t_hsk.forEach(async (t) => {
            await pool.query(`INSERT INTO hist_housekeeping_transactions(transactionid, reservationid, description, roomnum,
                            transaction_type, ref_itemid, transactiondate, employeeid, remarks, 
                            price, qty, archiveddate, 
                            accountid, hotelid, amount, paid, approvalcode, folioid)
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                `, [t.transactionid, t.reservationid, t.description, t.roomnum,
                    t.transaction_type, t.ref_itemid, t.transactiondate, t.employeeid, t.remarks, 
                    t.price, t.qty, t.archiveddate, 
                    t.accountid, t.hotelid, t.amount, t.paid, t.approvalcode, t.folioid])
        })

        //- delete ga
        const q8 = `
            DELETE FROM guestaccounts
            WHERE hotelid = $1 AND
                accountid = $2
        `
        const q8result = await pool.query(q8, [hotelID, id])


        

        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
    
})



module.exports = router