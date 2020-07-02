//引入本js文件需要先引入crypto-js.js
//16进制字符串转为2进制：
function hex2bin(str){
	var res="";
	for(var i=0;i<str.length;i++){
		var u=parseInt(str[i],16).toString(2);
		var ulength=u.length;
		for(var j=0;j<4-ulength;j++){
			u="0"+u;
		}
		res+=u;
	}
	return res;
}
//2进制字符串转为16进制：
function bin2hex(str){
	var len=str.length;
	var res="";
	for(var i=0;i<len;i=i+4){
		var u=parseInt(str.slice(i,i+4),2).toString(16);
		res+=u;
	}
	return res;
}
//用字符串作为密码：
function getKey(msg){
	return CryptoJS.enc.Utf8.parse(CryptoJS.SHA256(msg));
}
//加解密参数：
const option={
		iv:CryptoJS.enc.Utf8.parse('ABCDEF1234123412'),
		mode:CryptoJS.mode.CBC,
		padding:CryptoJS.pad.Pkcs7,
};
//加密：
function encryption(str,word){
	var mykey=getKey(word);
	var encrypted=CryptoJS.AES.encrypt(str,mykey,option);
	return encrypted.toString();
}
//解密：
function decryption(str,word){
	var mykey=getKey(word);
	var decrypted=CryptoJS.AES.decrypt(str,mykey,option);
	return decrypted.toString(CryptoJS.enc.Utf8);
}
//读取png文件并解码出图像数据(imagedata)：
function readPng(file,callback){
	var myCanvas=document.createElement("canvas");
	var ctx=myCanvas.getContext("2d");		
	myImage=new Image();
	myImage.onload=function(){
	    myCanvas.width=myImage.width;
	    myCanvas.height=myImage.height;
		ctx.drawImage(myImage,0,0);
	    callback(ctx.getImageData(0,0,myCanvas.width,myCanvas.height));
    };	
	var myReader=new FileReader();
	myReader.onload=function(e){
		myImage.src=e.target.result;
	};
	myReader.readAsDataURL(file);
}
//用图像数据(imagedata)写入DataURL：
function writePng(myimagedata){
	var myCanvas=document.createElement("canvas");
	myCanvas.width=myimagedata.width;
	myCanvas.height=myimagedata.height;
	var ctx=myCanvas.getContext("2d");
	ctx.putImageData(myimagedata,0,0);
	return myCanvas.toDataURL();
}
//把字符串编码到imagedata中：
function encode2imagedata(str,imgdata,password=null){
	var data;
	if(password){
		data=encryption(str,password);
	} else {
		data=CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
	}
	var hexdata=CryptoJS.enc.Base64.parse(data).toString();
	var bindata=hex2bin(hexdata);
	var lenbindata=bindata.length;
	var metadata=lenbindata.toString(2);
	var lenmetadata=metadata.length;
	for(var i=0;i<64-lenmetadata;i++){
		metadata="0"+metadata;
	}
	bindata=metadata+bindata;
	var maxlen=imgdata.data.length;
	if(bindata.length>maxlen){
		alert("数据超长！不允许超过"+maxlen+"字符");
		return imgdata;
	}
	var newdata=new Uint8ClampedArray(imgdata.data);	
	var newimgdata=new ImageData(newdata,imgdata.width,imgdata.height);
	for(var i=0;i<bindata.length;i++){
		newimgdata.data[i]-=newimgdata.data[i] % 2;
		newimgdata.data[i]+=parseInt(bindata[i]);
	}
	return newimgdata;
}
//从imagedata解密字符串：
function decode2string(imgdata,password=null){
	var mdata=imgdata.data.slice(0,64);
	var metadatastring="";
	for(var i=0;i<64;i++){
		metadatastring+=mdata[i] % 2;
	}
	var metadata=parseInt(parseInt(metadatastring,2).toString(10),10);
	var maxdatalength=imgdata.data.length-64;
	if(metadata>maxdatalength){
		alert("数据错误！文件已损坏。");
		return "";
	}
	var datastring="";
	for(var i=64;i<metadata+64;i++){
		datastring+=imgdata.data[i] % 2;
	}
	var hexdata=bin2hex(datastring);
	var str;
	if(password){
		str=decryption(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hexdata)),password);
	} else {
		str=CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(hexdata));
	}
	return str;
}