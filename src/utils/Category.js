export const getCategoryName = (categoryId) => {
  const categoryMap = {
    '20': '伦理片',
    '40': '悬疑片',
    '41': '战争片',
    '42': '犯罪片',
    '43': '剧情片',
    '44': '恐怖片',
    '45': '科幻片',
    '46': '爱情片',
    '47': '喜剧片',
    '48': '动作片',
    '49': '奇幻片',
    '50': '冒险片',
    '51': '惊悚片',
    '52': '动画片',
    '53': '记录片'
  };
  return categoryMap[categoryId] || `หมวดหมู่ ${categoryId}`;
};

export const getFilterName = (filter) => {
  const filterMap = {
    'trending': 'กำลังฮิต',
    'education': 'การศึกษา',
    'travel': 'ท่องเที่ยว',
    'cooking': 'ทำอาหาร',
    'music': 'ดนตรี',
    'news': 'ข่าว'
  };
  return filterMap[filter] || filter;
};
