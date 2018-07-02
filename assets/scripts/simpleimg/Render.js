//所需的全局变量
var finalImg;
var fixregion;
var cscale = 1;

function ShowPruneImg(cvs, fixx, fixy, fixr, rate, py, child, neighbor, cscale, cannyImg) {
    finalImg = {
        r: math.zeros(cvs.height, cvs.width),
        g: math.zeros(cvs.height, cvs.width),
        b: math.zeros(cvs.height, cvs.width)
    };
    fixregion = FixToRegion(fixx, fixy, fixr, rate, py, child);
    CalFixRegionFamily(fixregion);
    //console.log(fixregion);
    PruneSection(py, child, neighbor, rate, fixr, cscale);//这个 超级慢 怎么办哇……
    //绘制线条
    for (var i = 0; i < rslt.size()[0]; i++) {
        for (var j = 0; j < rslt.size()[1]; j++) {
            if (rslt._data[i][j] == 0) {
                finalImg.r._data[i][j] = 0;
                finalImg.g._data[i][j] = 0;
                finalImg.b._data[i][j] = 0;
            }
        }
    }
    MatrixToImg(finalImg, cvs);
}

//绘制图片
function PruneSection(py, child, neighbor, rate, fixr, cscale){
    //从爸爸开始搜索
    var level = py.idPy.length;
    for (var i = 0; i < child[level - 1].length; i++) {
        var nowid = child[level - 1][i][1];
        var nowlevel = child[level - 1][i][0];
        if (nowlevel == 0) {
            Draw(py, nowlevel, nowid, rate);
        }
        else if (child[nowlevel-1][nowid].length == 0) {
            Draw(py,nowlevel, nowid, rate);
        }
        else {
            if (Split(py, child, neighbor, nowlevel, nowid, fixr, cscale) == false) {
                Draw(py, nowlevel, nowid, rate);
            }
            else {
                PruneChild(py, child, neighbor, nowlevel, nowid,rate);
            }
        }
    }
}
//递归函数判断绘制
function PruneChild(py, child, neighbor,plevel, pid,rate) {
    if (plevel == 0) {
        Draw(py,plevel, pid,rate);
    }
    else {
        for (var i = 0; i < child[plevel - 1][pid].length; i++) {
            if (Split(py, child, neighbor, child[plevel - 1][pid][i][0], child[plevel - 1][pid][i][1], fixr, cscale, fixr, cscale) == false){
                Draw(py,child[plevel - 1][pid][i][0], child[plevel - 1][pid][i][1], rate);
            }
            else {
                PruneChild(py, child, neighbor, child[plevel - 1][pid][i][0], child[plevel - 1][pid][i][1], rate);
            }
        }
    }
}
//绘制函数
function Draw(py, level, id, rate) {
    //console.log(level, id);
    var r = 1/math.pow(rate, level);
    for (var i = 0; i < finalImg.r.size()[0]; i++) {
        for (var j = 0; j < finalImg.r.size()[1]; j++) {
            var idi = parseInt(i * r);
            var idj = parseInt(j * r);
            idi = math.min(idi, py.segPy[level].r.size()[0]-1);
            idj = math.min(idj, py.segPy[level].r.size()[1]-1);
            if (py.idPy[level].idmap._data[idi][idj] == id) {
                finalImg.r._data[i][j] = py.segPy[level].r._data[idi][idj];
                finalImg.g._data[i][j] = py.segPy[level].g._data[idi][idj];
                finalImg.b._data[i][j] = py.segPy[level].b._data[idi][idj];
            }
        }
    }
}
//判断是否需要详细绘制
//判断公式需要修改……因为没有看懂原文的单位，所以这里只是暂时这么定了
function Split(py, child, neighbor, level, id, fixr, cscale) {
    return true;/////////////////////////////////////debug用，记得删
    var childnum = child[level - 1][id].length;
    var rchildnum = 0;
    for (var i = 0; i < childnum; i++) {
        var contrast = CalculateContrast(py, child, neighbor, level, id);
        var f = 0.5 / py.idPy[level].idPxNum[id];
        var e = CalculateEss();
        if (cscale * contrast * e * fixr * f > 1) {
            rchildnum++;
        }
    }
    if (rchildnum * 2 > childnum) {
        return true;
    }
    else {
        return false;
    }
}
//计算某个region的essentricity
function CalculateEss(level,id) {
    var flag = 0;
    for (var i = 0; i < fixfamily.length; i++) {
        if (fixfamily[i][0] == level && fixfamily[i][1] == id) {
            flag = 1;
            break;
        }
    }
    if (flag==1) {
        return 1;
    }
    else {
        return 0.1;
    }
}

//计算fixation相关的区域亲友团
var fixfamily = new Array();
function CalFixRegionFamily(fix) { 
    fixfamily.push(fix);
    //先push孩子
    var level = fix[0];
    var id = fix[1];
    if (level > 0) {
        for (var i = 0; i < child[level - 1][id].length; i++) {
            CalFixRegionFamily([level - 1, child[level - 1][id][i]]);
        }
    }
}

//计算某个region和周围的对比度
function CalculateContrast(py, child, neighbor,level, id) {
    var weightsum = 0;
    var contrastsum = 0;
    for (var i = 0; i < neighbor[level].size()[0]; i++) {
        if (neighbor[level]._data[i][id] > 0) {
            var weight = neighbor[level]._data[i][id];
            //这里没有用平方，简单起见
            var contrast = ((py.idPy[level].idAvgCol[id].r - py.idPy[level].idAvgCol[i].r) +
                (py.idPy[level].idAvgCol[id].g - py.idPy[level].idAvgCol[i].g) +
                (py.idPy[level].idAvgCol[id].b - py.idPy[level].idAvgCol[i].b)) /
                ((py.idPy[level].idAvgCol[id].r + py.idPy[level].idAvgCol[i].r) +
                    (py.idPy[level].idAvgCol[id].g + py.idPy[level].idAvgCol[i].g) +
                    (py.idPy[level].idAvgCol[id].b + py.idPy[level].idAvgCol[i].b));
            contrastsum += weight * contrast;
            weightsum += weight;
        }
    }
    return contrastsum / weightsum;
}
// 判断可见
//fixx是水平方向，fixy是竖直方向……
function FixToRegion(fixx, fixy, fixr, rate, py, child) {
    var rset = new Array();//所有可能的点【level，id，num】
    var rslt=0;

    //获得所有在fix内的region并计数
    var minx = math.round(fixx - fixr); minx = math.max(minx, 0);
    var miny = math.round(fixy - fixr); miny = math.max(miny, 0);
    var maxx = math.round(fixx + fixr); maxx = math.min(py.idPy[0].idmap.size()[1] - 1, maxx);
    var maxy = math.round(fixy + fixr); maxy = math.min(py.idPy[0].idmap.size()[0] - 1, maxy);

    for (var l = 0; l < py.idPy.length; l++) {
        for (var i = miny; i <= maxy; i++) {
            for (var j=minx; j <= maxx; j++) {
                var id = py.idPy[l].idmap._data[i][j];
                var flag = 0;
                for (var k = 0; k < rset.length; k++) {
                    if (rset[k][0] == l && rset[k][1] == id) {
                        rset[k][2]++;
                        flag = 1;
                    }
                }
                if (flag == 0) {
                    rset.push([l, id, 0]);
                }
            }
        }
        minx = parseInt(minx / rate);
        miny = parseInt(miny / rate);
        maxx = parseInt(maxx / rate);
        maxy = parseInt(maxy / rate);
    }

    //判断是否符合fix
    for (var i = 0; i< rset.length;i++) {
        //对0层
        if (rset[i][0] == 0) {
            //不完全在r里面，则取消该点
            if (rset[i][2] < py.idPy[rset[i][0]].idPxNum[rset[i][1]]) {
                rset.splice(i, 1);
                i--;
            }
        }
        //对于上层，遍历孩子
        else {
            var totalnum = 0
            for (var j = 0; j < child[rset[i][0] - 1][rset[i][1]].length; j++) {
                var nowchild = child[rset[i][0] - 1][rset[i][1]][j];
                //孩子是否在数组里
                for (var k = 0; k < rset.length; k++) {
                    if (rset[k][0] == rset[i][0] - 1 && nowchild == rset[k][1]) {
                        //孩子是否完全在圆圈里
                        if (rset[k][2] == py.idPy[k[0]].idPxNum[rset[k][1]]) {
                            totalnum += rset[i][2];
                        }
                    }
                }
                
            }
            if (totalnum > fixr * fixr * 0.5 && totalnum > py.idPy[rset[i][0]].idPxNum[rset[i][1]] * 0.5) {
                rslt = [rset[i][0],rset[i][1]];
            }
        }
    }

    //若没有符合的点
    if (rslt == 0) {
        rslt = [0, py.idPy[0].idmap._data[fixy][fixx]];
    }

    return rslt;
}
