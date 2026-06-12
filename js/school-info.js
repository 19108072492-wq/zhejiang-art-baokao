// 院校官网与简介映射（预置知名院校，其余按需搜索缓存）
window.__schoolInfo = {
  // 985 院校
  "浙江大学": { web: "https://www.zju.edu.cn", intro: "教育部直属全国重点大学，C9联盟成员，985/211/双一流A类，艺术与科技、设计学等专业实力强劲。" },
  "北京大学": { web: "https://www.pku.edu.cn", intro: "中国最高学府之一，985/211/双一流A类，艺术学院涵盖艺术史论、戏剧与影视等方向。" },
  "清华大学": { web: "https://www.tsinghua.edu.cn", intro: "中国顶尖研究型大学，985/211/双一流A类，美术学院（原中央工艺美院）在艺术设计领域全国领先。" },
  "中国人民大学": { web: "https://www.ruc.edu.cn", intro: "人文社会科学重镇，985/211/双一流A类，艺术学院设有设计、音乐、美术等专业。" },
  "上海交通大学": { web: "https://www.sjtu.edu.cn", intro: "C9联盟成员，985/211/双一流A类，设计学院与媒体与传播学院设有艺术类专业。" },
  "同济大学": { web: "https://www.tongji.edu.cn", intro: "985/211/双一流A类，设计创意学院在工业设计、视觉传达领域享有盛誉。" },
  "复旦大学": { web: "https://www.fudan.edu.cn", intro: "985/211/双一流A类，艺术教育中心涵盖影视、美术等方向。" },
  "南京大学": { web: "https://www.nju.edu.cn", intro: "C9联盟成员，985/211/双一流A类，艺术学院设有艺术史论、文化创意等方向。" },
  "东南大学": { web: "https://www.seu.edu.cn", intro: "建筑老八校之一，985/211/双一流A类，艺术设计、建筑学底蕴深厚。" },
  "武汉大学": { web: "https://www.whu.edu.cn", intro: "985/211/双一流A类，城市设计学院设有设计学、建筑学等艺术相关专业。" },
  "华中科技大学": { web: "https://www.hust.edu.cn", intro: "985/211/双一流A类，建筑与城市规划学院、新闻与信息传播学院涉及艺术方向。" },
  "四川大学": { web: "https://www.scu.edu.cn", intro: "985/211/双一流A类，艺术学院涵盖美术、设计、舞蹈、音乐等多个方向。" },
  "重庆大学": { web: "https://www.cqu.edu.cn", intro: "建筑老八校之一，985/211/双一流A类，艺术学院与美视电影学院实力强大。" },
  "厦门大学": { web: "https://www.xmu.edu.cn", intro: "985/211/双一流A类，艺术学院设有美术、音乐、设计等专业，校园环境优美。" },
  "中南大学": { web: "https://www.csu.edu.cn", intro: "985/211/双一流A类，建筑与艺术学院涵盖艺术设计、产品设计等方向。" },
  "湖南大学": { web: "https://www.hnu.edu.cn", intro: "985/211/双一流A类，设计艺术学院在设计学领域全国领先。" },
  "南开大学": { web: "https://www.nankai.edu.cn", intro: "985/211/双一流A类，东方艺术系与设计系提供美术、设计类专业。" },
  "山东大学": { web: "https://www.sdu.edu.cn", intro: "985/211/双一流A类，艺术学院涵盖美术、音乐、设计等方向。" },
  "吉林大学": { web: "https://www.jlu.edu.cn", intro: "985/211/双一流A类，艺术学院设有绘画、视觉传达、音乐等专业。" },
  "东北大学": { web: "https://www.neu.edu.cn", intro: "985/211/双一流B类，艺术学院涵盖视觉传达、环境设计等方向。" },
  "兰州大学": { web: "https://www.lzu.edu.cn", intro: "985/211/双一流A类，艺术学院设有设计、音乐表演等方向。" },
  "西北农林科技大学": { web: "https://www.nwafu.edu.cn", intro: "985/211/双一流B类，风景园林等艺术相关专业。" },
  "中国海洋大学": { web: "https://www.ouc.edu.cn", intro: "985/211/双一流A类，设有音乐表演等艺术类专业。" },
  "华东师范大学": { web: "https://www.ecnu.edu.cn", intro: "985/211/双一流A类，设计学院与音乐学院在艺术教育领域有重要影响。" },
  "北京师范大学": { web: "https://www.bnu.edu.cn", intro: "985/211/双一流A类，艺术与传媒学院涵盖影视、音乐、美术等方向。" },
  "北京理工大学": { web: "https://www.bit.edu.cn", intro: "985/211/双一流A类，设计与艺术学院设有工业设计、视觉传达等专业。" },
  "北京航空航天大学": { web: "https://www.buaa.edu.cn", intro: "985/211/双一流A类，新媒体艺术与设计学院涵盖插画、动画等方向。" },
  "哈尔滨工业大学": { web: "https://www.hit.edu.cn", intro: "C9联盟成员，985/211/双一流A类，建筑学院与媒体艺术学科实力强劲。" },
  "华南理工大学": { web: "https://www.scut.edu.cn", intro: "建筑老八校之一，985/211/双一流A类，设计学院与艺术学院实力突出。" },
  "大连理工大学": { web: "https://www.dlut.edu.cn", intro: "985/211/双一流A类，建筑与艺术学院涵盖设计、雕塑等方向。" },
  "西安交通大学": { web: "https://www.xjtu.edu.cn", intro: "C9联盟成员，985/211/双一流A类，人文学院有艺术与设计相关方向。" },
  "西北工业大学": { web: "https://www.nwpu.edu.cn", intro: "985/211/双一流A类，机电学院工业设计方向有独特优势。" },

  // 211 / 双一流院校
  "东华大学": { web: "https://www.dhu.edu.cn", intro: "211/双一流，以纺织服装为特色，服装与艺术设计学院全国顶尖。" },
  "江南大学": { web: "https://www.jiangnan.edu.cn", intro: "211/双一流，设计学院在设计学领域全国领先，产品设计、视觉传达等专业突出。" },
  "苏州大学": { web: "https://www.suda.edu.cn", intro: "211/双一流，艺术学院涵盖美术、设计、音乐等方向，办学历史悠久。" },
  "上海大学": { web: "https://www.shu.edu.cn", intro: "211/双一流，上海美术学院（原上海大学美术学院）在美术与设计领域实力雄厚。" },
  "南京师范大学": { web: "https://www.njnu.edu.cn", intro: "211/双一流，美术学院与音乐学院在师范艺术教育领域全国领先。" },
  "南京航空航天大学": { web: "https://www.nuaa.edu.cn", intro: "211/双一流，艺术学院设有设计学、广播电视等方向。" },
  "南京理工大学": { web: "https://www.njUST.edu.cn", intro: "211/双一流，设计艺术与传媒学院涵盖工业设计、视觉传达等方向。" },
  "河海大学": { web: "https://www.hhu.edu.cn", intro: "211/双一流，设有环境设计、数字媒体等艺术类专业。" },
  "南京农业大学": { web: "https://www.njau.edu.cn", intro: "211/双一流，园艺、风景园林等与艺术交叉方向。" },
  "中国矿业大学": { web: "https://www.cumt.edu.cn", intro: "211/双一流，建筑与设计学院设有设计学、建筑学等专业。" },
  "合肥工业大学": { web: "https://www.hfut.edu.cn", intro: "211/双一流，建筑与艺术学院涵盖设计、美术、建筑等方向。" },
  "安徽大学": { web: "https://www.ahu.edu.cn", intro: "211/双一流，艺术学院设有绘画、视觉传达设计等方向。" },
  "福州大学": { web: "https://www.fzu.edu.cn", intro: "211/双一流，厦门工艺美术学院在工艺美术、设计领域有独特优势。" },
  "南昌大学": { web: "https://www.ncu.edu.cn", intro: "211/双一流，艺术与设计学院涵盖美术、设计、舞蹈等多个方向。" },
  "郑州大学": { web: "https://www.zzu.edu.cn", intro: "211/双一流，美术学院与音乐学院提供多个艺术类专业。" },
  "武汉理工大学": { web: "https://www.whut.edu.cn", intro: "211/双一流，艺术与设计学院在设计学科领域有较强实力。" },
  "华中师范大学": { web: "https://www.ccnu.edu.cn", intro: "211/双一流，美术学院与音乐学院在师范艺术教育领域有重要地位。" },
  "华中农业大学": { web: "https://www.hzau.edu.cn", intro: "211/双一流，园林、风景园林等专业涉及艺术设计方向。" },
  "湖南师范大学": { web: "https://www.hunnu.edu.cn", intro: "211/双一流，美术学院与音乐学院是湖南省艺术教育的重镇。" },
  "暨南大学": { web: "https://www.jnu.edu.cn", intro: "211/双一流，艺术学院涵盖戏剧影视、美术、书法等方向。" },
  "华南师范大学": { web: "https://www.scnu.edu.cn", intro: "211/双一流，美术学院与音乐学院提供多个艺术类专业。" },
  "西南大学": { web: "https://www.swu.edu.cn", intro: "211/双一流，美术学院与音乐学院是西南地区艺术教育的重要基地。" },
  "西南交通大学": { web: "https://www.swjtu.edu.cn", intro: "211/双一流，建筑与设计学院涵盖设计、建筑、美术等方向。" },
  "云南大学": { web: "https://www.ynu.edu.cn", intro: "211/双一流，艺术与设计学院设有美术、设计、音乐等专业。" },
  "陕西师范大学": { web: "https://www.snnu.edu.cn", intro: "211/双一流，美术学院与音乐学院师范类艺术教育历史悠久。" },
  "西北大学": { web: "https://www.nwu.edu.cn", intro: "211/双一流，艺术学院涵盖美术、设计、动画等方向。" },
  "北京工业大学": { web: "https://www.bjut.edu.cn", intro: "211/双一流，艺术设计学院设有数字媒体、视觉传达等专业。" },
  "北京林业大学": { web: "https://www.bjfu.edu.cn", intro: "211/双一流，艺术设计学院在环境设计、产品设计方面有特色。" },
  "北京化工大学": { web: "https://www.buct.edu.cn", intro: "211/双一流，产品设计等艺术类专业。" },
  "北京交通大学": { web: "https://www.bjtu.edu.cn", intro: "211/双一流，建筑与艺术学院设有视觉传达、数字媒体等专业。" },
  "北京邮电大学": { web: "https://www.bupt.edu.cn", intro: "211/双一流，数字媒体与设计艺术学院在交互设计领域有优势。" },
  "中国地质大学(武汉)": { web: "https://www.cug.edu.cn", intro: "211/双一流，珠宝学院首饰设计方向全国顶尖。" },
  "中国地质大学(北京)": { web: "https://www.cugb.edu.cn", intro: "211/双一流，珠宝首饰设计方向有独特优势。" },
  "中南财经政法大学": { web: "https://www.zuel.edu.cn", intro: "211/双一流，中韩新媒体学院设有视觉传达、电影学等方向。" },
  "华北电力大学": { web: "https://www.ncepu.edu.cn", intro: "211/双一流，产品设计等艺术类专业。" },

  // 艺术类专门院校
  "中国美术学院": { web: "https://www.caa.edu.cn", intro: "国内顶尖美术院校，美术学、设计学双一流学科，联合国教科文组织认证。" },
  "中央美术学院": { web: "https://www.cafa.edu.cn", intro: "教育部直属唯一高等美术院校，美术学、设计学双一流学科，全球知名。" },
  "清华大学美术学院": { web: "https://www.ad.tsinghua.edu.cn", intro: "原中央工艺美术学院，设计学全国第一，在工业设计、视觉传达等领域领先。" },
  "四川美术学院": { web: "https://www.scfai.edu.cn", intro: "西南地区最高美术学府，油画、雕塑、设计等专业全国知名。" },
  "广州美术学院": { web: "https://www.gzarts.edu.cn", intro: "华南地区最高美术学府，设计学、美术学实力强劲。" },
  "西安美术学院": { web: "https://www.xafa.edu.cn", intro: "西北地区最高美术学府，国画、油画、设计等方向有深厚底蕴。" },
  "湖北美术学院": { web: "https://www.hifa.edu.cn", intro: "华中地区最高美术学府，美术学、设计学为特色学科。" },
  "鲁迅美术学院": { web: "https://www.lumei.edu.cn", intro: "东北地区最高美术学府，雕塑、油画、设计等专业全国知名。" },
  "天津美术学院": { web: "https://www.tjarts.edu.cn", intro: "北方重要美术院校，国画、油画、视觉传达等方向有特色。" },
  "南京艺术学院": { web: "https://www.nua.edu.cn", intro: "中国最早独立建制的高等艺术学府，美术、音乐、设计、舞蹈等多学科综合。" },
  "山东工艺美术学院": { web: "https://www.sdada.edu.cn", intro: "全国32所独立设置的艺术院校之一，设计学科实力突出。" },
  "广西艺术学院": { web: "https://www.gxau.edu.cn", intro: "华南地区重要艺术学府，美术、音乐、舞蹈、设计等方向全面。" },
  "云南艺术学院": { web: "https://www.ynart.edu.cn", intro: "西南地区重要艺术学府，民族艺术、设计、戏剧等方向有特色。" },
  "吉林艺术学院": { web: "https://www.jlart.edu.cn", intro: "东北地区重要艺术学府，美术、设计、音乐、舞蹈等方向齐全。" },
  "新疆艺术学院": { web: "https://www.xjart.edu.cn", intro: "西北边疆重要艺术学府，民族歌舞、美术等方向有独特优势。" },
  "北京电影学院": { web: "https://www.bfa.edu.cn", intro: "亚洲最大、世界知名的电影专业院校，导演、表演、摄影等方向全国领先。" },
  "中央戏剧学院": { web: "https://www.chntheatre.edu.cn", intro: "中国戏剧影视艺术教育最高学府，双一流学科。" },
  "上海戏剧学院": { web: "https://www.sta.edu.cn", intro: "华东地区戏剧影视教育重镇，培养了大批演艺人才。" },
  "中国戏曲学院": { web: "https://www.nacta.edu.cn", intro: "中国戏曲艺术教育最高学府，国粹传承基地。" },
  "北京舞蹈学院": { web: "https://www.bda.edu.cn", intro: "中国舞蹈教育最高学府，培养专业舞蹈人才。" },
  "中央音乐学院": { web: "https://www.ccom.edu.cn", intro: "中国音乐教育最高学府，双一流学科建设高校。" },
  "中国音乐学院": { web: "https://www.ccmusic.edu.cn", intro: "民族音乐教育最高学府，双一流学科建设高校。" },
  "上海音乐学院": { web: "https://www.shcmusic.edu.cn", intro: "中国最早独立建制的高等音乐学府，双一流学科。" },
  "四川音乐学院": { web: "https://www.sccm.cn", intro: "西南地区最高音乐学府，音乐、舞蹈、美术等多学科融合。" },
  "浙江音乐学院": { web: "https://www.zjcm.edu.cn", intro: "浙江省属全日制本科音乐院校，近年发展迅速，设施一流。" },
  "西安音乐学院": { web: "https://www.xacom.edu.cn", intro: "西北地区最高音乐学府，音乐表演、音乐教育等专业突出。" },
  "武汉音乐学院": { web: "https://www.whcm.edu.cn", intro: "华中地区最高音乐学府，音乐表演、作曲等方向实力强劲。" },
  "沈阳音乐学院": { web: "https://www.sycm.edu.cn", intro: "东北地区最高音乐学府，培养了众多著名音乐家。" },
  "天津音乐学院": { web: "https://www.tjcm.edu.cn", intro: "北方重要音乐学府，音乐表演、音乐教育等方向齐全。" },
  "上海视觉艺术学院": { web: "https://www.siva.edu.cn", intro: "民办艺术院校，视觉传达、新媒体、时尚设计等方向特色鲜明。" },
  "北京服装学院": { web: "https://www.bift.edu.cn", intro: "国内领先的服装设计院校，服装与服饰设计专业全国一流。" },
  "北京印刷学院": { web: "https://www.bigc.edu.cn", intro: "以印刷、出版、传媒为特色，设计学、数字媒体等专业实力突出。" },
  "浙江传媒学院": { web: "https://www.cuz.edu.cn", intro: "全国知名传媒院校，播音主持、编导、动画等专业在业界有重要影响。" },
  "景德镇陶瓷大学": { web: "https://www.jci.edu.cn", intro: "唯一以陶瓷为特色的多科性大学，陶瓷艺术设计全国独一无二。" },
  "山东艺术学院": { web: "https://www.sdca.edu.cn", intro: "山东省唯一独立设置的艺术院校，美术、音乐、戏剧等方向齐全。" },
  "大连艺术学院": { web: "https://www.dac.edu.cn", intro: "民办艺术院校，音乐、舞蹈、美术、传媒等多学科发展。" },
  "河北美术学院": { web: "https://www.hbafa.edu.cn", intro: "民办美术院校，书法、国画、雕塑等方向有特色。" },

  // 浙江省内重点院校
  "浙江工业大学": { web: "https://www.zjut.edu.cn", intro: "浙江省属重点大学，设计艺术学院涵盖工业设计、视觉传达、环境设计等方向。" },
  "浙江师范大学": { web: "https://www.zjnu.edu.cn", intro: "浙江省属重点大学，美术学院与音乐学院是省艺术教育的重要基地。" },
  "浙江理工大学": { web: "https://www.zstu.edu.cn", intro: "浙江省属重点大学，服装设计与工程、艺术设计等专业全国知名，前身为浙江丝绸工学院。" },
  "浙江工商大学": { web: "https://www.zjgsu.edu.cn", intro: "浙江省属重点大学，艺术设计学院设有视觉传达、环境设计、动画等方向。" },
  "杭州电子科技大学": { web: "https://www.hdu.edu.cn", intro: "浙江省属重点大学，数字媒体与艺术设计学院在交互设计方面有特色。" },
  "浙江财经大学": { web: "https://www.zufe.edu.cn", intro: "浙江省属高校，艺术学院设有视觉传达、环境设计、摄影等方向。" },
  "中国计量大学": { web: "https://www.cjlu.edu.cn", intro: "浙江省属高校，艺术与传播学院设有视觉传达、工业设计等方向。" },
  "浙江农林大学": { web: "https://www.zafu.edu.cn", intro: "浙江省属高校，艺术设计学院涵盖视觉传达、环境设计、服装设计等方向。" },
  "浙江科技大学": { web: "https://www.zust.edu.cn", intro: "浙江省属高校，艺术设计学院与中德合作办学特色鲜明，前身为浙江科技学院。" },
  "浙江外国语学院": { web: "https://www.zisu.edu.cn", intro: "浙江省属高校，艺术学院设有美术学、视觉传达设计等专业。" },
  "杭州师范大学": { web: "https://www.hznu.edu.cn", intro: "浙江省属高校，美术学院（原杭州师范学院美术系）办学历史悠久。" },
  "宁波大学": { web: "https://www.nbu.edu.cn", intro: "双一流建设高校，潘天寿建筑与艺术设计学院涵盖多个艺术方向。" },
  "温州大学": { web: "https://www.wzu.edu.cn", intro: "浙江省属高校，美术与设计学院设有美术学、视觉传达、环境设计等专业。" },
  "温州肯恩大学": { web: "https://www.wku.edu.cn", intro: "中美合作大学，建筑与设计学院提供国际化艺术设计教育。" },
  "湖州师范学院": { web: "https://www.hutc.zj.cn", intro: "浙江省属高校，艺术学院涵盖美术、音乐、设计等方向。" },
  "绍兴文理学院": { web: "https://www.usx.edu.cn", intro: "浙江省属高校，艺术学院（兰亭书法学院）书法教育全国知名。" },
  "嘉兴大学": { web: "https://www.zjxu.edu.cn", intro: "浙江省属高校，设计学院设有视觉传达、环境设计等专业。" },
  "台州学院": { web: "https://www.tzc.edu.cn", intro: "浙江省属高校，艺术与设计学院涵盖美术、音乐、视觉传达等方向。" },
  "丽水学院": { web: "https://www.lsu.edu.cn", intro: "浙江省属高校，中国青瓷学院在陶瓷艺术方向有独特优势。" },
  "衢州学院": { web: "https://www.qzc.edu.cn", intro: "浙江省属高校，设有视觉传达设计等艺术类专业。" },
  "浙大城市学院": { web: "https://www.zucc.edu.cn", intro: "独立学院转设的普通本科，艺术与考古学院涉及美术、设计方向。" },
  "浙大宁波理工学院": { web: "https://www.nit.net.cn", intro: "独立学院转设的普通本科，设计学院涵盖数字媒体、环境设计等专业。" },
  "浙江树人学院": { web: "https://www.zjsru.edu.cn", intro: "浙江省民办本科院校，艺术学院设有视觉传达、产品设计等方向。" },
  "浙江越秀外国语学院": { web: "https://www.zyufl.edu.cn", intro: "民办本科院校，网络传播学院涉及数字媒体艺术方向。" },
  "宁波财经学院": { web: "https://www.nbdhyu.edu.cn", intro: "民办本科院校，艺术设计学院涵盖视觉传达、环境设计等方向。" },
  "温州商学院": { web: "https://www.wzbc.edu.cn", intro: "民办本科院校，传媒与设计艺术学院设有视觉传达、产品设计等方向。" },
  "浙江万里学院": { web: "https://www.zwu.edu.cn", intro: "民办本科院校，设计艺术与建筑学院涵盖多个设计方向。" },

  // 其他常见艺术招生院校
  "北京城市学院": { web: "https://www.bcu.edu.cn", intro: "民办本科院校，艺术设计学部涵盖视觉传达、环境设计、服装设计等方向。" },
  "燕京理工学院": { web: "https://www.yit.edu.cn", intro: "民办本科院校，艺术学院设有视觉传达、环境设计、服装等方向。" },
  "首都师范大学科德学院": { web: "https://www.kdcnu.com", intro: "独立学院，艺术设计、传媒类方向有特色。" },
  "北京工商大学": { web: "https://www.btbu.edu.cn", intro: "市属重点大学，艺术与传媒学院设有视觉传达、产品设计等方向。" },
  "北京联合大学": { web: "https://www.buu.edu.cn", intro: "市属综合性大学，艺术学院涵盖美术、设计、音乐、表演等方向。" },
  "天津工业大学": { web: "https://www.tiangong.edu.cn", intro: "双一流，纺织科学与工程为特色，服装设计、视觉传达等方向突出。" },
  "天津科技大学": { web: "https://www.tust.edu.cn", intro: "市属高校，艺术设计学院设有视觉传达、产品设计等专业。" },
  "天津师范大学": { web: "https://www.tjnu.edu.cn", intro: "市属重点大学，美术与设计学院涵盖绘画、设计、美术教育等方向。" },
  "天津城建大学": { web: "https://www.tcu.edu.cn", intro: "市属高校，城市艺术学院在环境设计方面有特色。" },
  "天津商业大学宝德学院": { web: "https://www.boustead.edu.cn", intro: "独立学院，艺术设计系设有视觉传达、环境设计等方向。" },
  "天津财经大学珠江学院": { web: "https://zhujiang.tjufe.edu.cn", intro: "独立学院，艺术学院设有视觉传达等方向。" },
  "河北大学": { web: "https://www.hbu.edu.cn", intro: "省属重点大学，艺术学院涵盖美术、设计、影视等方向。" },
  "河北工业大学": { web: "https://www.hebut.edu.cn", intro: "211/双一流，建筑与艺术设计学院涵盖工业设计、视觉传达等方向。" },
  "河北师范大学": { web: "https://www.hebtu.edu.cn", intro: "省属重点大学，美术与设计学院是河北艺术教育的重要基地。" },
  "燕山大学": { web: "https://www.ysu.edu.cn", intro: "省属重点大学，艺术与设计学院设有产品设计、视觉传达等专业。" },
  "山西大学": { web: "https://www.sxu.edu.cn", intro: "双一流，美术学院与音乐学院提供多个艺术类方向。" },
  "太原理工大学": { web: "https://www.tyut.edu.cn", intro: "211/双一流，艺术学院涵盖视觉传达、环境设计、动画等方向。" },
  "内蒙古师范大学": { web: "https://www.imnu.edu.cn", intro: "省属重点大学，美术学院与音乐学院实力较强。" },
  "鲁迅美术学院": { web: "https://www.lumei.edu.cn", intro: "东北三省最高美术学府，雕塑、油画全国知名。" },
  "东北师范大学": { web: "https://www.nenu.edu.cn", intro: "211/双一流，美术学院与音乐学院是全国艺术教育的标杆之一。" },
  "哈尔滨师范大学": { web: "https://www.hrbnu.edu.cn", intro: "省属重点大学，美术学院与音乐学院是东北地区艺术教育重镇。" },
  "东北林业大学": { web: "https://www.nefu.edu.cn", intro: "211/双一流，园林风景园林涉及艺术设计方向。" },
  "江苏大学": { web: "https://www.ujs.edu.cn", intro: "省属重点大学，艺术学院设有视觉传达、环境设计、动画等专业。" },
  "扬州大学": { web: "https://www.yzu.edu.cn", intro: "省属重点大学，美术与设计学院涵盖绘画、设计等方向。" },
  "南通大学": { web: "https://www.ntu.edu.cn", intro: "省属高校，艺术学院设有美术、音乐、设计等方向。" },
  "南京林业大学": { web: "https://www.njfu.edu.cn", intro: "双一流，艺术设计学院在环境设计、产品设计方面有特色。" },
  "常州大学": { web: "https://www.cczu.edu.cn", intro: "省属高校，美术与设计学院设有视觉传达、产品设计等专业。" },
  "南京信息工程大学": { web: "https://www.nuist.edu.cn", intro: "双一流，传媒与艺术学院涵盖动画、数字媒体等方向。" },
  "浙江艺术职业学院": { web: "https://www.zj-art.com", intro: "浙江省属艺术高职院校，美术、音乐、舞蹈、戏剧等方向齐全。" },
  
  // 对于未收录的院校，以下函数用于按需搜索
};

// 搜索记录缓存（避免重复搜索）
window.__schoolInfoCache = {};

// 从 localStorage 恢复缓存
(function() {
  try {
    var cached = localStorage.getItem('zjyk_school_cache');
    if (cached) window.__schoolInfoCache = JSON.parse(cached);
  } catch(e) {}
})();

// 获取院校信息（优先从缓存获取）
window.getSchoolInfo = function(schoolName) {
  // 去除名称中的括号后缀（如 "浙江大学（985、211）" -> "浙江大学"）
  var cleanName = schoolName.replace(/[（(][^)）]*[)）]/g, '').trim();
  
  // 1. 先查预置映射
  if (window.__schoolInfo[cleanName]) return window.__schoolInfo[cleanName];
  if (window.__schoolInfo[schoolName]) return window.__schoolInfo[schoolName];
  
  // 2. 查缓存
  if (window.__schoolInfoCache[cleanName]) return window.__schoolInfoCache[cleanName];
  if (window.__schoolInfoCache[schoolName]) return window.__schoolInfoCache[schoolName];
  
  // 3. 未找到
  return null;
};

// 缓存搜索结果
window.cacheSchoolInfo = function(schoolName, info) {
  var cleanName = schoolName.replace(/[（(][^)）]*[)）]/g, '').trim();
  window.__schoolInfoCache[cleanName] = info;
  try {
    localStorage.setItem('zjyk_school_cache', JSON.stringify(window.__schoolInfoCache));
  } catch(e) {}
};
