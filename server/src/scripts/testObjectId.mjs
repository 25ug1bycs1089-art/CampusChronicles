import mongoose from 'mongoose';
console.log('Is "pending" a valid ObjectId?', mongoose.Types.ObjectId.isValid('pending'));
console.log('Route order matters. "pending" as :id would fail isValid check.');
