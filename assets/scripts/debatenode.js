window.onload = function hello() {
    
    //输入辩论头部文本框点击事件
    var o_arr = $("input");
    o_arr.each(function () {
        var tips = this.value;
        this.style.color = "#999999";
        this.onfocus = function () {
            if (this.value === tips) {
                this.value = "";
            }
            this.style.color = "#000000";
        };
        this.onblur = function () {
            if (this.value === "" || this.value === tips) {
                this.value = tips;
                this.style.color = "#999999";
            } else {
                this.style.color = "#000000";
            }
        };
    });
    
    //点击加号按钮
    var a_arr = $(".add-node");
    a_arr.each(function () {
        this.onclick = function () {
            
            //添加子选项
            var t = this.parentNode.parentNode.parentNode;
            $('<div class="children"><div class="children-head"><div class="children-node"><input type="text" value="选项" data-toggle="tooltip" data-placement="right" title="输入选项名称"><input type="text" value="对白" data-toggle="tooltip" data-placement="right" title="输入对白提示"><button class="add-node" type="button" data-toggle="tooltip" data-placement="right" title="添加后续选项">+</button></div></div><div class="children-area"></div>').appendTo($(t).children(".children-area"));
            
            //重载一遍……
            hello();
        }
    });
}