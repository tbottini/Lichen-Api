/**
 * 
 * @param researchElements : list of elements 
 * @param token : base entry for research
 * @param researchAttrName : the name of the attribute that was used as search criteria  
 * @returns sort elements
 */
function researchSort(researchElements, token : string, getSearchKey , keepResearchValue = false) {
    var elements =  researchElements
      .map(researchItem => {
        var searchableEntry = getSearchKey(researchItem);

        if (!searchableEntry.length) return null;
        const correspondingValue = highChain(token, searchableEntry);
        
        researchItem.correspondingValue = correspondingValue;
        
        
        return researchItem;
      })
      .sort(function (a, b) {
        return b.correspondingValue - a.correspondingValue})
     
    return elements.filter(researchItem => elements[0].correspondingValue - researchItem.correspondingValue < 5) .map(item => {
      if (keepResearchValue == false)
        delete item.correspondingValue;
      return item});;
  }

  function highChain(token : string, search : string) {
    var correspondingValue = 0;

    //sup is a variable who'll allow to count if the first letter is the same
    var correspondingValueBonus = 0;

    if (search[0] == token[0]) correspondingValueBonus += 3;
    var j = 0,
      i = 0;
    while (search[j] && correspondingValue < search.length - i) {
      while (token[i] == search[j] && token[i] && search[j]) {
        i++;
        j++;
      }
      if (i > correspondingValue) {
        correspondingValue = i;
        i = 0;
      }
      j++;
    }
    return correspondingValue + correspondingValueBonus;
  }


  module.exports = { researchSort};