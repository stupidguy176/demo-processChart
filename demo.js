const inputData = [
    {
      baseLots: 1, 
      productId: 1,
      unit: 161.548498,
      data: [
        {t:1,b:2,e:2},
        {t:1,b:2,e:2}
      ],
      totalData: [
        {GrossLoss: 0,GrossProfit: 1910,ID: 4950349884,ProfitTotal: 1910,ProfitTrades: 12,TradesTotal: 12},
        {GrossLoss: 0,GrossProfit: 1910,ID: 4950349884,ProfitTotal: 1910,ProfitTrades: 12,TradesTotal: 12},
      ]
    }
  ]
  
  
  function processChart(dataChart, dec = {}) {
      let lData = [],
        tData = [],
        l1 = [],
        l2 = [],
        ls = {},
        dd = 0,
        lastD = 0,
        portIncrease = 0,
        maxPortIncrease = 0,
        maxPortDD = 0,
        profitFactor = 0,
        winningRate = 0,
        recovery = 0,
        avgProfit = 0,
        objChart = {}
  
      // tiền xử lý dữ liệu của từng product - ví dụ có 3 product thì chạy 3 lần
      for (let i in dataChart) {
        let baseLots = dataChart[i].baseLots,
        lot = typeof dec[i] === 'number' ? dec[i] : 0.1 // nếu ko có truyền vô thì lấy mặc định là 0.1
  
        // diameter = số lot truyền trên gui vô / số baseLots mặc định
        let diameter = lot / baseLots
  
        // nếu ko có baseLots thì diameter = số do user nhập vô hoặc mặc định là 0.1
        if(!baseLots) diameter = lot
  
        
        let oData = dataChart[i].data
        ls[i] = []
        // tiền xử lý data của từng ngày cho mỗi product - ví dụ mỗi product có 4 ngày data -> vòng này chạy 4 lần
        for (let j in oData) {
          let tmp = oData[j]
          tmp.b *= diameter // b = b gốc * diameter
          tmp.e *= diameter // e = e gốc * diameter
  
          // line chart
          ls[i].push([tmp.t, Math.round(tmp.b, 2)])
  
          // sum b if same t
          if (objChart[tmp.t] == undefined) {
            objChart[tmp.t] = 0
          }
          objChart[tmp.t] += tmp.b || 0 // t = t gốc + b mới tính ở bước trên
        }
        
        // let oData = dataChart[i].data
        // gôm hết array data của từng product về chung 1 array là lData
        lData = lData.concat(oData)
        // gôm hết array totalData của từng product về chung 1 array là tData
        tData = tData.concat(dataChart[i].totalData)
      }
  
    
      // tính tổng hết GrossLoss, GrossProfit,... của tất cả product
      tData = tData.reduce(
        (res, val) => {
          res.GrossLoss += parseFloat(val.GrossLoss)
          res.GrossProfit += parseFloat(val.GrossProfit)
          res.ProfitTotal += parseFloat(val.ProfitTotal)
          res.ProfitTrades += parseInt(val.ProfitTrades)
          res.TradesTotal += parseInt(val.TradesTotal)
          return res
        },
        {
          GrossLoss: 0,
          GrossProfit: 0,
          ProfitTotal: 0,
          ProfitTrades: 0,
          TradesTotal: 0,
        }
      )
    
      // tiền xử lý lData
      // sắp xếp lData theo thứ tự từ bé đến lớn theo t
      // let oData = dataChart[i].data
      // lData = lData.concat(oData)
       lData.sort((a, b) => {
        return a.t - b.t
      })
  
      // lData = 1 array gôm hết data của các product lại và sắp xếp theo t của data=[{t:1,b:2,e:4}]
      if(lData.length) {      
        for (let k in lData) {
          let tmp1 = lData[k]
          
          // l1 gain/loss portfolio line
          // l2 portfolio line

          // nếu khác t -> vẽ thêm 1 điểm -> nên push vào
          if (lastD !== tmp1.t) {
            l1.push([tmp1.t, Math.round(tmp1.b, 2)])
            l2.push([tmp1.t, Math.round(tmp1.b + tmp1.e, 2)])
          } else {
            // nếu cùng t -> cùng 1 điểm -> cộng dồn giá trị lại
            l1[l1.length - 1][1] += Math.round(tmp1.b, 2)
            l2[l2.length - 1][1] += Math.round(tmp1.b + tmp1.e, 2)
          }
          lastD = tmp1.t
        }
      }
  

      // objChart có dạng 
      // t = t + (b*(lot/baseLots))
      // const objChart = {
      // 1683471600000: 1683471600000 + (874426*(lot(user nhập vào) / baseLots))
      // 1683558000000: 1683558000000 + (87442222*(lot(user nhập vào) / baseLots))
      // }

      // const objChart = {2:88, 6:99, 3: 77}
      // ock = ['2', '3', '6'] - 34 77 55 
      let ock = Object.keys(objChart)

      // maxPortDD = lấy 2 số đầu của mảng ock trừ nhau
      // = 77 - 34 = 43
      maxPortDD = objChart[ock[1]] - objChart[ock[0]], // maxPortDD = 43
      maxPortIncrease = objChart[ock[0]] // maxPortIncrease = 34
  
      if(ock.length) {
        // do bỏ 2 số đầu đã khởi tạo ở trên
        // nên sẽ tính từ i = 2
        for (let i = 2, l = ock.length; i < l; i++) {
          portIncrease = objChart[ock[i]] // portIncrease = 55
          if (maxPortIncrease < portIncrease) { // 34 < 55 
            maxPortIncrease = portIncrease // maxPortIncrease = 55
          }
          dd = maxPortIncrease - portIncrease // 55 - 55 = 0
          if (maxPortDD < dd) { // 43 < 0
            maxPortDD = dd
          }
        }
      }

        // 総損益 là portIncrease
        // 最大ドローダウン là maxPortDD
  
      // calculator summary
      if (tData.GrossLoss !== 0) {
        profitFactor = parseFloat((tData.GrossProfit / tData.GrossLoss) * -1).toFixed(2)
      }
      if (tData.TradesTotal !== 0) {
        winningRate = parseFloat((tData.ProfitTrades / tData.TradesTotal) * 100).toFixed(2)
        avgProfit = Math.round(portIncrease / tData.TradesTotal, 0)
      }
      if (maxPortDD !== 0) {
        recovery = parseFloat(portIncrease / maxPortDD).toFixed(2)
      }
  
      return [
        l1,
        l2,
        ls,
        {
          portIncrease,
          maxPortIncrease,
          maxPortDD,
          profitFactor,
          winningRate,
          recovery,
          avgProfit,
        },
      ]
  }
  
  