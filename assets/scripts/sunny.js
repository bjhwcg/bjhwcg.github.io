window.onload = function () {
	//菜单栏头像隐蔽
	$("#head-picture").animate({ width: "0", opacity: "0", left: "50%" }, "slow");
	//禁止点击sunny
    $("#sunny-button").removeAttr("href");
	$("#sunny-button")[0].style.backgroundColor="#FFFFFF";
	$("#sunny-button")[0].style.color="#000000"
	//出现单元介绍
	var parent = $("#head-picture-warper")[0];
	var child = document.createElement("p");
	child.setAttribute('id', "sunny-introduction"); 
	child.innerHTML = "此章<br />虚实结合<br />用于存活确认<br /><hr />开个玩笑<br />😛";
	parent.appendChild(child);    
	
}