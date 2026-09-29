const mongoose = require('mongoose');
const { Schema } = mongoose;
const {nanoid} = require("nanoid")

const documentSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    default:"Untitled",
    trim: true
  },

  linkId:{
    type:String,
    required:[true,"Link Id is required"],
    trim:true,
    unique:true,
    default:nanoid(10)
  },

  content: {
    type: String,
    default:''
  },

  owner: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref:"User"
  },


  collaborators: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref:"User"
  }],

  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;