const mongoose = require("mongoose")
const Document = require("../models/document.model")
const AppError = require("../error/errorClass")
const htmlDocx = require("html-docx-js")

const createDocument = async(userId)=>{
    userId = new mongoose.Types.ObjectId(userId)
    const newDoc = await Document.create({owner:userId})

    if(!newDoc) throw new AppError("Failed to create document", 402)

    return newDoc.linkId
}


const getDocument = async(docId)=>{
    const getDoc = await Document.findOne({linkId:docId}).select('-_id')

    if(!getDoc) throw new AppError("Failed to get document", 405)

    return getDoc
}

const getDocuments = async(userId)=>{
    const getDocs = await Document.find({owner:userId}).select('-_id')

    if(!getDocs) throw new AppError("Failed to get documents", 405)

    return getDocs
}

const deleteDocument = async(docId)=>{
    await Document.findOneAndDelete({linkId:docId}).select('-_id')
}

const downloadDocument = async(content)=>{

     const fullHtmlString = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${content}</body></html>`;

    // 1. html-docx-js compiles it into a buffer format Word 2010 loves
    const docxOutput = htmlDocx.asBlob(fullHtmlString);

    const arrayBuffer = await docxOutput.arrayBuffer();

    if(!arrayBuffer) throw new AppError("Failed to download document to DOCX")

    return arrayBuffer
}

module.exports = {createDocument, getDocument, getDocuments, deleteDocument, downloadDocument}