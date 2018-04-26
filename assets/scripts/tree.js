window.onload = function () {
	//菜单栏头像隐蔽
	$("#head-picture").animate({ width: "0", opacity: "0", left: "50%" }, "slow");
	//禁止点击tree
    $("#tree-button").removeAttr("href");
	$("#tree-button")[0].style.backgroundColor="#FFFFFF";
	$("#tree-button")[0].style.color="#000000"
	//出现单元介绍
	var parent = $("#head-picture-warper")[0];
	var child = document.createElement("p");
	child.setAttribute('id', "tree-introduction"); 
	child.innerHTML = "此章<br />一个童话<br />一只树下的板栗<br /><hr />就当做笑话吧<br />😛";
	parent.appendChild(child);    
	
}