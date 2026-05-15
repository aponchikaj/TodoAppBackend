import ERRORS from "../models/error.model.js";

const newError = async(errorMessage='No Error Message.',errorLocation='No Error Location.')=>{

    try{
        console.log("Error occured in " + errorLocation + " Error Message: " + errorMessage);
        await ERRORS.create({
            errorLocation:errorLocation,
            errorMessage:errorMessage
        })

        return {Success:true};

    }catch(e){
        console.log("Something went wrong while making new Error. ERROR: ",e);
        return {Success:false}
    }
}

export default newError;