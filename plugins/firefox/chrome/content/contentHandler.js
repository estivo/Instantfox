InstantFox.contentHandler = {
	setGoogleLocation: function(){
		content.document.getElementById("lst-ib").value='opera ';
		content.document.getElementById("gac_scont").style.display='none';
		content.document.getElementById("gray").style.display='none';	
	},
	finishGoogleLocation: function(){
		content.document.getElementById("gac_scont").style.display='';
		content.document.getElementById("gray").style.display=''
	}
}
// google test
/*p=document.getElementById("grey")//.value
p=document.getElementById("lst-ib")//.value

#>>
document.activeElement

#>>
yui=['hys','hystot','hysoiy','hystr','hystt opi']
i=0
cont = true
function x(){
    p.value =yui[i]
    i++
    if(i>=yui.length)
        i=0
    cont && setTimeout(x, 100)
	console.log(p.value)
}
x()
#>>
*/