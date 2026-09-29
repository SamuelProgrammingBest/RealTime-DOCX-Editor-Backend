const mongoose = require("mongoose")


const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Userame is required'],
    unique:true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    // lowercase: true,
    trim: true
  },

  password:{
    type: String,
    required: [true, 'Password is required'],
    unique: true,
    minLength:8,
    select:false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);

module.exports = User;