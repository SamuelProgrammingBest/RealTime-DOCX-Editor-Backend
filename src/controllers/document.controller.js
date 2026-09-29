const { createDocument, getDocument, getDocuments, deleteDocument, downloadDocument } = require("../services/document.service")

const createDoc = async (req, res) => {
    const { userId } = req.user
    const document = await createDocument(userId)

    return res.status(202).send(
        {
            status: "successful",
            documentId: document
        }
    )
}

const getDoc = async (req, res) => {
    const { docId } = req.params
    const document = await getDocument(docId)

    return res.status(202).send(
        {
            status: "successful",
            document
        }
    )
}

const getDocs = async (req, res) => {
    const { userId } = req.user
    const documents = await getDocuments(userId)

    return res.status(202).send(
        {
            status: "successful",
            documents
        }
    )
}


const delDoc = async (req, res) => {
    const { docId } = req.params
    await deleteDocument(docId)

    return res.status(202).send(
        {
            status: "successful",
            message: "Successful Deletion of Document"
        }
    )
}

const downloadDoc = async (req, res) => {
    const { title, content } = req.body

    const docBuffer = await downloadDocument(content)

    // Send the binary Word file buffer back to the client
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    // res.send(docBuffer);
    const base64 = Buffer.from(docBuffer).toString("base64")
    return res.status(202).send(
        {
            status: "successful",
            message: "Download is successful",
            document: base64,
            title
        }
    )
}

module.exports = { createDoc, getDoc, getDocs, delDoc, downloadDoc }