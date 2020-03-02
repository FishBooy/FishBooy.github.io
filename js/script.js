;(function(){

  // Add className for prism parser
  const codeBlocks = document.querySelectorAll('code');
  const supportedLang = ['javascript','css','html','jsx','sass','scss']
  codeBlocks.forEach(function(code){
    const classList = code.classList;
    const className = classList.value.toLowerCase();
    if (className && classList.length === 1 && supportedLang.indexOf(className) !== -1) {
      classList.add(`language-${className}`);
      classList.add(`lang-${className}`);

      const prev = code.closest('pre');
      prev && prev.classList.add('line-numbers');
    } else if (!className) {
      classList.add('inline');
    }
  });

  // List the content
  const postBody = document.querySelector('.post-body');
  const childNodesInPost = postBody ? postBody.childNodes : [];
  const htmlTagsForList = ['h2','h3','h4','h5','h6'];
  const contentList = [];

  childNodesInPost.forEach((child)=>{
    const tagName=child.tagName;
    if(tagName && htmlTagsForList.indexOf(tagName.toLowerCase())!= -1){
        contentList.push(child);
    }
  });

  if (contentList.length) {
    const postCatalog = document.querySelector('.post-catalog');
    const catalogContainer = document.createElement('ul');
    postCatalog.classList.add('show');
    catalogContainer.className = 'catalog-container';
    postCatalog.append(catalogContainer);

    contentList.forEach(function(node){
      const listNode = document.createElement('li');
      const linkNode = node.querySelector('a').cloneNode(true);
      listNode.className = `${node.tagName.toLowerCase()}-link`;
      if (linkNode) {
        linkNode.innerText = node.textContent;
        listNode.append(linkNode);
      }
      catalogContainer.appendChild(listNode);
    });
  }

})();