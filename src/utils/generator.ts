export  const  generateVerificationCode= async() :Promise<string> =>{
    const verificationCode = Math.random().toString(36).substring(2, 15);
    return verificationCode;
  }