window.onload = function () {
    //菜单栏头像消失
	$("#head-picture").animate({ width: "0", opacity: "0", left: "50%" }, "slow");
	//正文头像出现
	$("#about-head-picture").animate({ width: "200px", opacity: "1" ,top:"0"}, "slow");
	//禁止点击about
    $("#about-button").removeAttr("href");
	$("#about-button")[0].style.backgroundColor="#FFFFFF";
	$("#about-button")[0].style.color="#000000"
}