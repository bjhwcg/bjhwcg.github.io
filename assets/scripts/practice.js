window.onload = function () {
	//菜单栏头像隐蔽
	$("#head-picture").animate({ width: "0", opacity: "0", left: "50%" }, "slow");
	//禁止点击tree
    $("#practice-button").removeAttr("href");
    $("#practice-button")[0].style.backgroundColor="#FFFFFF";
    $("#practice-button")[0].style.color="#000000"
	//出现单元介绍
	var parent = $("#head-picture-warper")[0];
	var child = document.createElement("p");
    child.setAttribute('id', "practice-introduction"); 
	child.innerHTML = "此章<br />描线练习<br />上色练习<br /><hr />flag倒了就扶起来<br />😐";
	parent.appendChild(child);    
	
}