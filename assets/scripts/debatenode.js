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
            $('<div class="children"><div class="children-head"><div class="children-node"><button class="del-node" type="button" data-toggle="tooltip" data-placement="right" title="删除选项">-</button><input type="text" value="选项" data-toggle="tooltip" data-placement="right" title="输入选项名称"><input type="text" value="对白" data-toggle="tooltip" data-placement="right" title="输入对白提示"><button class="add-node" type="button" data-toggle="tooltip" data-placement="right" title="添加后续选项">+</button></div></div><div class="children-area"></div>').appendTo($(t).children(".children-area"));
            
            //不讲性能地重载一遍……
            hello();
        }
    });
    

    
    
    //点击减号按钮
    var a_arr = $(".del-node");
    a_arr.each(function () {
        this.onclick = function () {           
            //删除选项
            $(this.parentNode.parentNode.parentNode).remove();
            $(this.parentNode.parentNode.parentNode).empty();
        }
        //连线
        var y0 = $(this).offset().top;
        var x0 = $(this).offset().left;
        var padd = $(this.parentNode.parentNode.parentNode).find(".add-node");
        var y1 = $(padd).offset().top;
        var x1 = $(padd).offset().left;
        $('canvas')[0].getContext('2d').beginPath();
        $('canvas')[0].getContext('2d').strokeStyle = 'blue';
        $('canvas')[0].getContext('2d').lineWidth = 20;
        $('canvas')[0].getContext('2d').moveTo(x0, y0);
        $('canvas')[0].getContext('2d').lineTo(x1, y1);
        $('canvas')[0].getContext('2d').stroke();
    });
    
    
    
}