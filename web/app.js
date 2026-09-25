// X sync Client App
const API_BASE = 'http://localhost:8765/api';

let currentTab = 'bookmark'; // 'bookmark', 'like', 'history'
let isBatchMode = false;
let selectedTweetIds = new Set();
let allLoadedTweets = [];
let allTags = [];

// DOM Elements
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const totalCountBadge = document.getElementById('total-count');
const syncButtonText = document.getElementById('sync-button-text');
const btnSyncNow = document.getElementById('btn-sync-now');

const searchText = document.getElementById('search-text');
const searchAuthor = document.getElementById('search-author');
const btnDoSearch = document.getElementById('btn-do-search');

const filterMedia = document.getElementById('filter-media');
const filterLang = document.getElementById('filter-lang');
const filterTime = document.getElementById('filter-time');
const filterTag = document.getElementById('filter-tag');
const filterSort = document.getElementById('filter-sort');

const btnBatchToggle = document.getElementById('btn-batch-toggle');
const batchBar = document.getElementById('batch-bar');
const selectAllCheck = document.getElementById('select-all-check');
const selectedCountSpan = document.getElementById('selected-count');

const btnBatchTag = document.getElementById('btn-batch-tag');
const btnExportMarkdown = document.getElementById('btn-export-markdown');
const btnBatchDelete = document.getElementById('btn-batch-delete');

const tweetsContainer = document.getElementById('tweets-container');
const emptyState = document.getElementById('empty-state');

const viewGrid = document.getElementById('view-grid');
const viewList = document.getElementById('view-list');

// Modals
const exportModal = document.getElementById('export-modal');
const btnCloseExport = document.getElementById('btn-close-export');
const btnCancelExport = document.getElementById('btn-cancel-export');
const btnConfirmExport = document.getElementById('btn-confirm-export');
const exportItemsCount = document.getElementById('export-items-count');
const mdPreviewCode = document.getElementById('md-preview-code');

const tagModal = document.getElementById('tag-modal');
const btnCloseTag = document.getElementById('btn-close-tag');
const btnCancelTag = document.getElementById('btn-cancel-tag');
const btnSaveTag = document.getElementById('btn-save-tag');
const inputTagName = document.getElementById('input-tag-name');
const quickTagsList = document.getElementById('quick-tags-list');

const btnManageAllTags = document.getElementById('btn-manage-all-tags');
const manageTagsModal = document.getElementById('manage-tags-modal');
const btnCloseManageTags = document.getElementById('btn-close-manage-tags');
const btnDoneManageTags = document.getElementById('btn-done-manage-tags');
const inputNewTagModal = document.getElementById('input-new-tag-modal');
const btnCreateTagModal = document.getElementById('btn-create-tag-modal');
const manageTagsList = document.getElementById('manage-tags-list');
const manageTagsTotalCount = document.getElementById('manage-tags-total-count');

const syncGuideModal = document.getElementById('sync-guide-modal');
const btnCloseGuide = document.getElementById('btn-close-guide');
const btnGuideOk = document.getElementById('btn-guide-ok');

const langSelect = document.getElementById('lang-select');

let currentTaggingTargetIds = [];

// Context Tag Popup Elements
const contextTagPopup = document.getElementById('context-tag-popup');
const btnCloseContextTag = document.getElementById('btn-close-context-tag');
const contextExistingTags = document.getElementById('context-existing-tags');
const contextTagInput = document.getElementById('context-tag-input');
const btnContextTagAdd = document.getElementById('btn-context-tag-add');
const contextQuickTags = document.getElementById('context-quick-tags');
const btnContextDelete = document.getElementById('btn-context-delete');

let currentContextTweet = null;
let activeContextCard = null;

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (typeof applyTranslations === 'function') {
    applyTranslations();
  }
  setupEventListeners();
  updateTabTitles();
  loadStats();
  loadTags();
  loadTweets();

  // Auto reload when switching back to dashboard tab
  window.addEventListener('focus', () => {
    loadStats();
    loadTweets();
  });
});

// React to language switch
window.onLanguageChanged = function(lang) {
  updateTabTitles();
  if (currentTab === 'history') {
    loadSyncHistory();
  } else {
    renderTweets(allLoadedTweets);
  }
};

function setupEventListeners() {
  // Language switcher
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  // Tabs
  document.getElementById('nav-bookmarks').addEventListener('click', () => switchTab('bookmark'));
  document.getElementById('nav-likes').addEventListener('click', () => switchTab('like'));
  document.getElementById('nav-history').addEventListener('click', () => switchTab('history'));
  const navHelp = document.getElementById('nav-help');
  if (navHelp) navHelp.addEventListener('click', () => showSyncGuide());

  btnSyncNow.addEventListener('click', () => showSyncGuide());

  // Search & Filter
  btnDoSearch.addEventListener('click', () => loadTweets());
  searchText.addEventListener('keyup', (e) => { if (e.key === 'Enter') loadTweets(); });
  searchAuthor.addEventListener('keyup', (e) => { if (e.key === 'Enter') loadTweets(); });

  filterMedia.addEventListener('change', () => loadTweets());
  filterLang.addEventListener('change', () => loadTweets());
  filterTime.addEventListener('change', () => loadTweets());
  filterTag.addEventListener('change', () => loadTweets());
  if (filterSort) {
    filterSort.addEventListener('change', () => {
      allLoadedTweets = sortTweets(allLoadedTweets, filterSort.value);
      renderTweets(allLoadedTweets);
    });
  }

  // View switch
  viewGrid.addEventListener('click', () => {
    viewGrid.classList.add('active');
    viewList.classList.remove('active');
    tweetsContainer.classList.remove('list-view');
  });

  viewList.addEventListener('click', () => {
    viewList.classList.add('active');
    viewGrid.classList.remove('active');
    tweetsContainer.classList.add('list-view');
  });

  // Batch
  btnBatchToggle.addEventListener('click', toggleBatchMode);
  selectAllCheck.addEventListener('change', toggleSelectAll);
  btnBatchDelete.addEventListener('click', handleBatchDelete);
  btnBatchTag.addEventListener('click', () => {
    if (selectedTweetIds.size === 0) return alert(t('tag_prompt_select'));
    openTagModal(Array.from(selectedTweetIds));
  });

  btnExportMarkdown.addEventListener('click', openExportModal);

  // Modals
  btnCloseExport.addEventListener('click', () => exportModal.style.display = 'none');
  btnCancelExport.addEventListener('click', () => exportModal.style.display = 'none');
  btnConfirmExport.addEventListener('click', doExportMarkdown);

  // Manage Tags Modal events
  if (btnManageAllTags) {
    btnManageAllTags.addEventListener('click', openManageTagsModal);
  }
  if (btnCloseManageTags) {
    btnCloseManageTags.addEventListener('click', closeManageTagsModal);
  }
  if (btnDoneManageTags) {
    btnDoneManageTags.addEventListener('click', closeManageTagsModal);
  }
  if (btnCreateTagModal) {
    btnCreateTagModal.addEventListener('click', handleCreateTagInModal);
  }
  if (inputNewTagModal) {
    inputNewTagModal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreateTagInModal();
      }
    });
  }

  btnCloseTag.addEventListener('click', () => tagModal.style.display = 'none');
  btnCancelTag.addEventListener('click', () => tagModal.style.display = 'none');
  btnSaveTag.addEventListener('click', saveTag);
  inputTagName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTag();
    }
  });

  // Context Tag Popup events
  if (btnCloseContextTag) {
    btnCloseContextTag.addEventListener('click', closeContextMenuTagPopup);
  }
  if (btnContextDelete) {
    btnContextDelete.addEventListener('click', deleteSingleTweet);
  }
  if (btnContextTagAdd) {
    btnContextTagAdd.addEventListener('click', () => {
      if (currentContextTweet && activeContextCard) {
        addTagToTweet(currentContextTweet, contextTagInput.value, activeContextCard);
      }
    });
  }
  if (contextTagInput) {
    contextTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentContextTweet && activeContextCard) {
          addTagToTweet(currentContextTweet, contextTagInput.value, activeContextCard);
        }
      }
    });
  }

  // Dismiss context menu on click outside or Esc
  document.addEventListener('mousedown', (e) => {
    if (contextTagPopup && contextTagPopup.style.display !== 'none') {
      if (!contextTagPopup.contains(e.target) && !e.target.closest('.tweet-card')) {
        closeContextMenuTagPopup();
      if (manageTagsModal && manageTagsModal.style.display !== 'none') {
        closeManageTagsModal();
      }
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContextMenuTagPopup();
    }
  });

  btnCloseGuide.addEventListener('click', () => syncGuideModal.style.display = 'none');
  btnGuideOk.addEventListener('click', () => syncGuideModal.style.display = 'none');

  document.querySelectorAll('input[name="export-mode"]').forEach(r => {
    r.addEventListener('change', updateMarkdownPreview);
  });
}

function updateTabTitles() {
  if (currentTab === 'bookmark') {
    pageTitle.textContent = t('bookmarks_title');
    pageSubtitle.textContent = t('bookmarks_subtitle');
    syncButtonText.textContent = t('btn_sync_bookmarks');
  } else if (currentTab === 'like') {
    pageTitle.textContent = t('likes_title');
    pageSubtitle.textContent = t('likes_subtitle');
    syncButtonText.textContent = t('btn_sync_likes');
  } else if (currentTab === 'history') {
    pageTitle.textContent = t('history_title');
    pageSubtitle.textContent = t('history_subtitle');
  }
}

function switchTab(tab) {
  closeContextMenuTagPopup();
  currentTab = tab;
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
  
  if (tab === 'bookmark') {
    document.getElementById('nav-bookmarks').classList.add('active');
    document.querySelector('.filter-section').style.display = 'block';
    updateTabTitles();
    loadTweets();
  } else if (tab === 'like') {
    document.getElementById('nav-likes').classList.add('active');
    document.querySelector('.filter-section').style.display = 'block';
    updateTabTitles();
    loadTweets();
  } else if (tab === 'history') {
    document.getElementById('nav-history').classList.add('active');
    document.querySelector('.filter-section').style.display = 'none';
    updateTabTitles();
    loadSyncHistory();
  }
}

async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await res.json();
    if (currentTab === 'bookmark') {
      totalCountBadge.textContent = Number(data.bookmark_count || 0).toLocaleString();
    } else if (currentTab === 'like') {
      totalCountBadge.textContent = Number(data.like_count || 0).toLocaleString();
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function loadTags() {
  try {
    const res = await fetch(`${API_BASE}/tags`);
    const data = await res.json();
    allTags = data.tags || [];

    // Populate dropdown
    const currentVal = filterTag.value;
    filterTag.innerHTML = `
      <option value="all">${t('filter_tag_all')}</option>
      <option value="none">${t('filter_tag_none')}</option>
    `;
    allTags.forEach(tItem => {
      const opt = document.createElement('option');
      opt.value = tItem.name;
      opt.textContent = `${tItem.name} (${tItem.count})`;
      filterTag.appendChild(opt);
    });
    filterTag.value = currentVal || 'all';

    // Populate quick tags in modal
    quickTagsList.innerHTML = '';
    allTags.forEach(tItem => {
      const pill = document.createElement('span');
      pill.className = 'card-tag-pill';
      pill.style.cursor = 'pointer';
      pill.textContent = tItem.name;
      pill.addEventListener('click', () => {
        inputTagName.value = tItem.name;
      });
      quickTagsList.appendChild(pill);
    });
  } catch (err) {
    console.error('Failed to load tags:', err);
  }
}

function sortTweets(tweets, sortMode = 'time_desc') {
  if (!tweets || tweets.length === 0) return tweets;
  const copy = [...tweets];

  // Build tag count map from allTags (單一標籤貼文總數對照表)
  const tagCountMap = {};
  if (Array.isArray(allTags)) {
    allTags.forEach(tItem => {
      if (tItem && tItem.name) {
        tagCountMap[tItem.name] = Number(tItem.count || 0);
      }
    });
  }

  const getMaxTagCount = (tw) => {
    if (typeof tw.max_tag_count === 'number') return tw.max_tag_count;
    if (!tw.tags || !Array.isArray(tw.tags) || tw.tags.length === 0) return 0;
    return Math.max(...tw.tags.map(tName => tagCountMap[tName] || 0));
  };

  const getMinTagCount = (tw) => {
    if (typeof tw.min_tag_count === 'number') return tw.min_tag_count;
    if (!tw.tags || !Array.isArray(tw.tags) || tw.tags.length === 0) return 0;
    const counts = tw.tags.map(tName => tagCountMap[tName] || 0);
    return counts.length > 0 ? Math.min(...counts) : 0;
  };

  switch (sortMode) {
    case 'time_desc':
      return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case 'time_asc':
      return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case 'tags_desc':
      // 單一標籤貼文總數最多排到最低
      return copy.sort((a, b) => {
        const countA = getMaxTagCount(a);
        const countB = getMaxTagCount(b);
        if (countB !== countA) {
          return countB - countA;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
    case 'tags_asc':
      // 單一標籤貼文總數最低排到最高 (有標籤者依貼文數小到大排，未標籤排在最後)
      return copy.sort((a, b) => {
        const countA = getMinTagCount(a);
        const countB = getMinTagCount(b);
        const hasA = countA > 0;
        const hasB = countB > 0;
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        if (countA !== countB) {
          return countA - countB;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
    default:
      return copy;
  }
}

function showToast(msg) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast-show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = '';
  }, 2000);
}

async function loadTweets() {
  const params = new URLSearchParams({
    type: currentTab,
    q: searchText.value.trim(),
    author: searchAuthor.value.trim(),
    media_type: filterMedia.value,
    lang: filterLang.value,
    time_range: filterTime.value,
    tag: filterTag.value,
    sort: filterSort ? filterSort.value : 'time_desc'
  });

  try {
    const res = await fetch(`${API_BASE}/tweets?${params.toString()}`);
    const data = await res.json();
    allLoadedTweets = sortTweets(data.tweets || [], filterSort ? filterSort.value : 'time_desc');
    totalCountBadge.textContent = Number(allLoadedTweets.length).toLocaleString();

    renderTweets(allLoadedTweets);
  } catch (err) {
    console.error('Failed to fetch tweets:', err);
    tweetsContainer.innerHTML = '<div style="padding: 40px; color: red;">無法連線至本地服務，請確認 ./start.sh 已啟動。</div>';
  }
}

function renderTweets(tweets) {
  tweetsContainer.innerHTML = '';
  if (tweets.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tweets.forEach(tweet => {
    const card = document.createElement('article');
    card.className = 'tweet-card';
    card.id = `card-${tweet.id}`;
    if (selectedTweetIds.has(tweet.id)) {
      card.classList.add('selected');
    }

    // Format date localized
    let formattedDate = tweet.created_at;
    try {
      const d = new Date(tweet.created_at);
      if (!isNaN(d.getTime())) {
        if (currentLang === 'en') {
          formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } else if (currentLang === 'fr') {
          formattedDate = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        } else if (currentLang === 'es') {
          formattedDate = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        } else if (currentLang === 'zh-CN') {
          formattedDate = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        } else {
          // zh-TW default
          formattedDate = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        }
      }
    } catch (_) {}

    // Batch checkbox
    const checkboxHtml = isBatchMode ? `
      <input type="checkbox" class="card-select-box" data-id="${tweet.id}" ${selectedTweetIds.has(tweet.id) ? 'checked' : ''}>
    ` : '';

    // Media HTML
    let mediaHtml = '';
    const mediaUrls = tweet.media_urls || [];
    if (mediaUrls.length === 3) {
      mediaHtml = `
        <div class="card-media">
          <div class="media-grid-3">
            <img src="${mediaUrls[0]}" alt="media 1" loading="lazy">
            <img src="${mediaUrls[1]}" alt="media 2" loading="lazy">
            <img src="${mediaUrls[2]}" alt="media 3" loading="lazy">
          </div>
        </div>
      `;
    } else if (tweet.media_type === 'video' || (mediaUrls.length === 1 && tweet.has_media)) {
      const src = mediaUrls[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
      mediaHtml = `
        <div class="card-media">
          <div class="media-single">
            <img src="${src}" alt="video thumbnail" loading="lazy">
            <span class="video-badge">${t('card_video_badge')}</span>
          </div>
        </div>
      `;
    } else if (mediaUrls.length > 0) {
      mediaHtml = `
        <div class="card-media">
          <div class="media-single">
            <img src="${mediaUrls[0]}" alt="media" loading="lazy">
          </div>
        </div>
      `;
    }

    // Tags HTML
    const tagsHtml = (tweet.tags || []).map(tag => {
      const cnt = (allTags.find(t => t.name === tag)?.count);
      const countTip = (cnt !== undefined && cnt !== null) ? ` (${cnt} 則貼文)` : '';
      return `<span class="card-tag-pill" title="#${escapeHtml(tag)}${countTip}">#${escapeHtml(tag)}</span>`;
    }).join('');

    card.innerHTML = `
      ${checkboxHtml}
      <div class="card-header">
        <div class="author-area">
          <img class="author-avatar" src="${tweet.author_avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'}" alt="${tweet.author_name}" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'">
          <div class="author-meta">
            <span class="author-name">${escapeHtml(tweet.author_name)}</span>
            <span class="author-handle-date">${escapeHtml(tweet.author_handle)} · ${formattedDate}</span>
          </div>
        </div>
        <a class="card-external-link" href="${tweet.tweet_url}" target="_blank" rel="noopener noreferrer" title="${t('card_tooltip_link')}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>

      <div class="card-content">
        <div class="tweet-text ${tweet.content.length > 140 ? 'text-collapsed' : ''}" id="text-${tweet.id}">${escapeHtml(tweet.content).replace(/\n/g, '<br>')}</div>
        ${tweet.content.length > 140 ? `<span class="btn-show-more" data-target="text-${tweet.id}">${t('card_show_more')}</span>` : ''}
      </div>

      ${mediaHtml}

      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}

      <div class="card-footer">
        <div class="tools-group">
          <button class="tool-icon-btn btn-card-copy" title="${t('card_tooltip_copy')}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="tool-icon-btn btn-card-tag" data-id="${tweet.id}" title="${t('card_tooltip_tag')}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Event bindings on card
    card.querySelectorAll('.btn-show-more').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-target');
        const textEl = document.getElementById(targetId);
        if (textEl.classList.contains('text-collapsed')) {
          textEl.classList.remove('text-collapsed');
          e.target.textContent = t('card_show_less');
        } else {
          textEl.classList.add('text-collapsed');
          e.target.textContent = t('card_show_more');
        }
      });
    });

    const checkbox = card.querySelector('.card-select-box');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedTweetIds.add(tweet.id);
          card.classList.add('selected');
        } else {
          selectedTweetIds.delete(tweet.id);
          card.classList.remove('selected');
        }
        updateSelectedCount();
      });
    }

    // Right-click context menu on individual card
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openContextMenuTagPopup(tweet, card, e.clientX, e.clientY);
    });

    card.querySelector('.btn-card-tag').addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      openContextMenuTagPopup(tweet, card, rect.left, rect.top - 220);
    });

    card.querySelector('.btn-card-copy').addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const contentText = (tweet.content || '').trim();
      const urlText = tweet.tweet_url || `https://x.com/i/status/${tweet.id}`;
      const copyPayload = contentText ? `${contentText}\n\n${urlText}` : urlText;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(copyPayload);
        } else {
          throw new Error('Clipboard API unavailable');
        }
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = copyPayload;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      // Visual feedback: flip to checkmark & update title
      const originalSvg = btn.innerHTML;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#1D9BF0" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      btn.style.color = '#1D9BF0';
      btn.setAttribute('title', t('copied_toast'));
      showToast(t('copied_toast'));

      setTimeout(() => {
        btn.innerHTML = originalSvg;
        btn.style.color = '';
        btn.setAttribute('title', t('card_tooltip_copy'));
      }, 1500);
    });

    tweetsContainer.appendChild(card);
  });
}

function toggleBatchMode() {
  isBatchMode = !isBatchMode;
  btnBatchToggle.classList.toggle('active', isBatchMode);
  batchBar.style.display = isBatchMode ? 'flex' : 'none';
  if (!isBatchMode) {
    selectedTweetIds.clear();
    selectAllCheck.checked = false;
  }
  updateSelectedCount();
  renderTweets(allLoadedTweets);
}

function toggleSelectAll(e) {
  const isChecked = e.target.checked;
  if (isChecked) {
    allLoadedTweets.forEach(tItem => selectedTweetIds.add(tItem.id));
  } else {
    selectedTweetIds.clear();
  }
  updateSelectedCount();
  renderTweets(allLoadedTweets);
}

function updateSelectedCount() {
  selectedCountSpan.textContent = selectedTweetIds.size;
  selectAllCheck.checked = selectedTweetIds.size > 0 && selectedTweetIds.size === allLoadedTweets.length;
}

async function handleBatchDelete() {
  if (selectedTweetIds.size === 0) return alert(t('delete_prompt_select'));
  if (!confirm(t('delete_confirm', { n: selectedTweetIds.size }))) return;

  try {
    const res = await fetch(`${API_BASE}/batch/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedTweetIds) })
    });
    const result = await res.json();
    if (result.status === 'success') {
      selectedTweetIds.clear();
      updateSelectedCount();
      loadStats();
      loadTweets();
    }
  } catch (err) {
    alert('刪除失敗: ' + err.message);
  }
}

// Tag Modal (Batch Tagging)
function openTagModal(targetIds) {
  closeContextMenuTagPopup();
  currentTaggingTargetIds = targetIds;
  inputTagName.value = '';
  tagModal.style.display = 'flex';
  inputTagName.focus();
}

async function saveTag() {
  const tag = inputTagName.value.trim().replace(/^#+/, '');
  if (!tag) return alert(t('tag_prompt_input'));

  try {
    const res = await fetch(`${API_BASE}/batch/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: currentTaggingTargetIds, tag: tag, action: 'add' })
    });
    const result = await res.json();
    if (result.status === 'success') {
      tagModal.style.display = 'none';
      loadTags();
      loadTweets();
    }
  } catch (err) {
    alert('標籤儲存失敗: ' + err.message);
  }
}

// Manage Tags Modal (Rename & Delete Tags)
function openManageTagsModal() {
  closeContextMenuTagPopup();
  if (inputNewTagModal) inputNewTagModal.value = '';
  renderManageTagsList();
  if (manageTagsModal) manageTagsModal.style.display = 'flex';
  if (inputNewTagModal) inputNewTagModal.focus();
}

function closeManageTagsModal() {
  if (manageTagsModal) {
    manageTagsModal.style.display = 'none';
  }
}

function renderManageTagsList() {
  if (!manageTagsList) return;
  manageTagsList.innerHTML = '';
  if (manageTagsTotalCount) {
    manageTagsTotalCount.textContent = `${allTags.length} 個標籤`;
  }

  if (allTags.length === 0) {
    manageTagsList.innerHTML = `<div class="manage-tags-empty">${t('tag_context_none')}</div>`;
    return;
  }

  allTags.forEach(tItem => {
    const row = document.createElement('div');
    row.className = 'manage-tag-row';
    row.id = `manage-tag-row-${tItem.name}`;

    row.innerHTML = `
      <div class="manage-tag-left">
        <span class="manage-tag-pill">#${escapeHtml(tItem.name)}</span>
        <span class="manage-tag-count">${tItem.count} 則推文</span>
      </div>
      <div class="manage-tag-actions">
        <button type="button" class="btn-tag-action btn-tag-rename" title="${t('tag_action_rename')}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          <span>${t('tag_action_rename')}</span>
        </button>
        <button type="button" class="btn-tag-action btn-tag-delete" title="${t('tag_action_delete')}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>${t('tag_action_delete')}</span>
        </button>
      </div>
    `;

    row.querySelector('.btn-tag-rename').addEventListener('click', () => {
      setupInlineTagRename(row, tItem.name);
    });

    row.querySelector('.btn-tag-delete').addEventListener('click', async () => {
      await handleTagDelete(tItem.name);
    });

    manageTagsList.appendChild(row);
  });
}

function setupInlineTagRename(row, oldName) {
  row.innerHTML = `
    <div class="manage-tag-edit-left">
      <span class="hash-prefix">#</span>
      <input type="text" class="text-input inline-tag-edit-input" value="${escapeHtml(oldName)}" />
    </div>
    <div class="manage-tag-actions">
      <button type="button" class="btn-tag-action btn-tag-save" title="${t('tag_action_save')}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#1D9BF0" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${t('tag_action_save')}</span>
      </button>
      <button type="button" class="btn-tag-action btn-tag-cancel" title="${t('btn_cancel')}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span>${t('btn_cancel')}</span>
      </button>
    </div>
  `;

  const input = row.querySelector('.inline-tag-edit-input');
  input.focus();
  input.select();

  const doSave = async () => {
    const newName = input.value.trim().replace(/^#+/, '');
    if (!newName) {
      alert(t('tag_prompt_input'));
      input.focus();
      return;
    }
    if (newName === oldName) {
      renderManageTagsList();
      return;
    }

    // Check if newName already exists in allTags (cannot rename to existing tag)
    const isDuplicate = allTags.some(tItem => tItem.name.toLowerCase() === newName.toLowerCase() && tItem.name.toLowerCase() !== oldName.toLowerCase());
    if (isDuplicate) {
      alert(t('tag_rename_exists_error', { name: newName }));
      input.focus();
      input.select();
      return;
    }

    await handleTagRename(oldName, newName);
  };

  row.querySelector('.btn-tag-save').addEventListener('click', doSave);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSave();
    } else if (e.key === 'Escape') {
      renderManageTagsList();
    }
  });
  row.querySelector('.btn-tag-cancel').addEventListener('click', () => {
    renderManageTagsList();
  });
}

async function handleTagRename(oldName, newName) {
  try {
    const res = await fetch(`${API_BASE}/tags/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_name: oldName, new_name: newName })
    });
    const result = await res.json();
    if (result.status === 'success') {
      allLoadedTweets.forEach(tw => {
        if (tw.tags && tw.tags.includes(oldName)) {
          tw.tags = tw.tags.filter(t => t !== oldName);
          if (!tw.tags.includes(newName)) {
            tw.tags.push(newName);
          }
        }
      });

      if (filterTag && filterTag.value === oldName) {
        filterTag.value = newName;
      }

      await loadTags();
      renderManageTagsList();
      renderTweets(allLoadedTweets);
      showToast(t('tag_rename_confirm', { name: newName }));
    } else {
      alert(result.message || '更名失敗');
    }
  } catch (err) {
    alert('更名失敗: ' + err.message);
  }
}

async function handleTagDelete(tagName) {
  const confirmMsg = t('tag_delete_confirm_msg', { name: tagName });
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`${API_BASE}/tags/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tagName })
    });
    const result = await res.json();
    if (result.status === 'success') {
      allLoadedTweets.forEach(tw => {
        if (tw.tags) {
          tw.tags = tw.tags.filter(t => t !== tagName);
        }
      });

      if (filterTag && filterTag.value === tagName) {
        filterTag.value = 'all';
      }

      await loadTags();
      renderManageTagsList();
      renderTweets(allLoadedTweets);
      showToast(t('tag_delete_success', { name: tagName }));
    } else {
      alert('刪除失敗: ' + (result.message || '未知錯誤'));
    }
  } catch (err) {
    alert('刪除失敗: ' + err.message);
  }
}

async function handleCreateTagInModal() {
  if (!inputNewTagModal) return;
  const raw = inputNewTagModal.value.trim().replace(/^#+/, '');
  if (!raw) {
    alert(t('tag_prompt_input'));
    inputNewTagModal.focus();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/batch/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [], tag: raw, action: 'add' })
    });
    const result = await res.json();
    if (result.status === 'success') {
      inputNewTagModal.value = '';
      await loadTags();
      renderManageTagsList();
      showToast(`標籤 #${raw} 已新增`);
    } else {
      alert('新增標籤失敗: ' + (result.message || '未知錯誤'));
    }
  } catch (err) {
    alert('新增標籤失敗: ' + err.message);
  }
}

// Right-Click Context Tag Popup Functions
function openContextMenuTagPopup(tweet, cardElement, clientX, clientY) {
  closeContextMenuTagPopup();

  currentContextTweet = tweet;
  activeContextCard = cardElement;
  cardElement.classList.add('context-active');

  renderContextExistingTags(tweet, cardElement);
  renderContextQuickTags(tweet, cardElement);

  contextTagInput.value = '';
  contextTagPopup.style.display = 'block';

  const popupRect = contextTagPopup.getBoundingClientRect();
  const width = popupRect.width || 320;
  const height = popupRect.height || 260;

  let x = clientX;
  let y = clientY;

  if (x + width > window.innerWidth - 12) {
    x = window.innerWidth - width - 12;
  }
  if (y + height > window.innerHeight - 12) {
    y = window.innerHeight - height - 12;
  }
  if (x < 12) x = 12;
  if (y < 12) y = 12;

  contextTagPopup.style.left = `${x}px`;
  contextTagPopup.style.top = `${y}px`;

  setTimeout(() => {
    contextTagInput.focus();
  }, 40);
}

function closeContextMenuTagPopup() {
  if (contextTagPopup) {
    contextTagPopup.style.display = 'none';
  }
  if (activeContextCard) {
    activeContextCard.classList.remove('context-active');
    activeContextCard = null;
  }
  currentContextTweet = null;
}

function renderContextExistingTags(tweet, cardElement) {
  contextExistingTags.innerHTML = '';
  const tags = tweet.tags || [];
  if (tags.length === 0) {
    contextExistingTags.innerHTML = `<span class="context-no-tags">${t('tag_context_none')}</span>`;
    return;
  }

  tags.forEach(tagName => {
    const pill = document.createElement('span');
    pill.className = 'context-tag-pill';
    pill.innerHTML = `
      <span>#${escapeHtml(tagName)}</span>
      <button type="button" class="btn-remove-tag" title="${t('tag_context_remove_tip')}">&times;</button>
    `;
    pill.querySelector('.btn-remove-tag').addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeTagFromTweet(tweet, tagName, cardElement);
    });
    contextExistingTags.appendChild(pill);
  });
}

function renderContextQuickTags(tweet, cardElement) {
  contextQuickTags.innerHTML = '';
  const currentTagsSet = new Set(tweet.tags || []);
  const availableTags = allTags.filter(tItem => !currentTagsSet.has(tItem.name));

  if (availableTags.length === 0) {
    contextQuickTags.innerHTML = `<span class="context-no-tags">${t('tag_context_none')}</span>`;
    return;
  }

  availableTags.forEach(tItem => {
    const pill = document.createElement('span');
    pill.className = 'context-quick-pill';
    pill.innerHTML = `<span class="quick-add-plus">+</span><span>#${escapeHtml(tItem.name)}</span>`;
    pill.addEventListener('click', async (e) => {
      e.stopPropagation();
      await addTagToTweet(tweet, tItem.name, cardElement);
    });
    contextQuickTags.appendChild(pill);
  });
}

async function addTagToTweet(tweet, rawTagName, cardElement) {
  const tagName = rawTagName.trim().replace(/^#+/, '');
  if (!tagName) {
    alert(t('tag_prompt_input'));
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/batch/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [tweet.id], tag: tagName, action: 'add' })
    });
    const result = await res.json();
    if (result.status === 'success') {
      if (!tweet.tags) tweet.tags = [];
      if (!tweet.tags.includes(tagName)) {
        tweet.tags.push(tagName);
      }
      updateCardTagsDOM(tweet, cardElement);
      closeContextMenuTagPopup();
      loadTags();
    } else {
      alert('新增標籤失敗: ' + (result.message || '未知錯誤'));
    }
  } catch (err) {
    alert('新增標籤失敗: ' + err.message);
  }
}

async function removeTagFromTweet(tweet, tagName, cardElement) {
  try {
    const res = await fetch(`${API_BASE}/batch/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [tweet.id], tag: tagName, action: 'remove' })
    });
    const result = await res.json();
    if (result.status === 'success') {
      tweet.tags = (tweet.tags || []).filter(t => t !== tagName);
      updateCardTagsDOM(tweet, cardElement);
      renderContextExistingTags(tweet, cardElement);
      renderContextQuickTags(tweet, cardElement);
      loadTags();
    } else {
      alert('移除標籤失敗: ' + (result.message || '未知錯誤'));
    }
  } catch (err) {
    alert('移除標籤失敗: ' + err.message);
  }
}

function updateCardTagsDOM(tweet, cardElement) {
  let tagsContainer = cardElement.querySelector('.card-tags');
  const tagsHtml = (tweet.tags || []).map(tag => `<span class="card-tag-pill">#${escapeHtml(tag)}</span>`).join('');
  if (tagsHtml) {
    if (!tagsContainer) {
      tagsContainer = document.createElement('div');
      tagsContainer.className = 'card-tags';
      const cardFooter = cardElement.querySelector('.card-footer');
      cardElement.insertBefore(tagsContainer, cardFooter);
    }
    tagsContainer.innerHTML = tagsHtml;
  } else if (tagsContainer) {
    tagsContainer.remove();
  }
}

async function deleteSingleTweet() {
  if (!currentContextTweet) return;
  const tweetId = currentContextTweet.id;
  const cardEl = activeContextCard || document.getElementById(`card-${tweetId}`);

  if (!confirm(t('delete_single_confirm'))) return;

  try {
    const res = await fetch(`${API_BASE}/batch/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [tweetId] })
    });
    const result = await res.json();
    if (result.status === 'success') {
      closeContextMenuTagPopup();
      allLoadedTweets = allLoadedTweets.filter(tItem => tItem.id !== tweetId);
      selectedTweetIds.delete(tweetId);
      updateSelectedCount();
      totalCountBadge.textContent = Number(allLoadedTweets.length).toLocaleString();

      if (cardEl) {
        cardEl.style.transition = 'all 0.2s ease';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.95)';
        setTimeout(() => {
          cardEl.remove();
          if (allLoadedTweets.length === 0) {
            emptyState.style.display = 'block';
          }
        }, 200);
      }
      loadStats();
      loadTags();
    } else {
      alert('刪除失敗: ' + (result.message || '未知錯誤'));
    }
  } catch (err) {
    alert('刪除失敗: ' + err.message);
  }
}

// Markdown Export Modal
async function openExportModal() {
  const ids = selectedTweetIds.size > 0 ? Array.from(selectedTweetIds) : allLoadedTweets.map(tItem => tItem.id);
  if (ids.length === 0) return alert(t('export_prompt_empty'));

  const countBadge = document.getElementById('export-items-count') || exportItemsCount;
  if (countBadge) {
    countBadge.textContent = `${ids.length} 篇`;
  }
  if (exportModal) {
    exportModal.style.display = 'flex';
  }
  updateMarkdownPreview();
}

async function updateMarkdownPreview() {
  const ids = selectedTweetIds.size > 0 ? Array.from(selectedTweetIds) : allLoadedTweets.map(tItem => tItem.id);
  if (ids.length === 0) return;
  const sampleId = ids[0];
  const previewEl = document.getElementById('md-preview-code') || mdPreviewCode;
  if (previewEl) {
    previewEl.textContent = '正在獲取即時預覽...';
  }

  try {
    const res = await fetch(`${API_BASE}/export/markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [sampleId], mode: 'combined' })
    });
    const data = await res.json();
    if (previewEl) {
      previewEl.textContent = data.markdown || '暫無內容';
    }
  } catch (err) {
    if (previewEl) {
      previewEl.textContent = '預覽生成失敗: ' + err.message;
    }
  }
}

async function doExportMarkdown() {
  const checkedRadio = document.querySelector('input[name="export-mode"]:checked');
  const mode = checkedRadio ? checkedRadio.value : 'combined';
  const ids = selectedTweetIds.size > 0 ? Array.from(selectedTweetIds) : allLoadedTweets.map(tItem => tItem.id);

  if (btnConfirmExport) {
    btnConfirmExport.textContent = t('btn_exporting');
    btnConfirmExport.disabled = true;
  }

  try {
    if (mode === 'zip') {
      const res = await fetch(`${API_BASE}/export/markdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids, mode: 'zip' })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `X_sync_markdown_archive_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } else {
      const res = await fetch(`${API_BASE}/export/markdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids, mode: 'combined' })
      });
      const data = await res.json();
      const blob = new Blob([data.markdown], { type: 'text/markdown;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `X_sync_export_${new Date().toISOString().slice(0,10)}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }

    if (exportModal) {
      exportModal.style.display = 'none';
    }
    showToast('Markdown 匯出成功！');
  } catch (err) {
    alert('匯出失敗: ' + err.message);
  } finally {
    if (btnConfirmExport) {
      btnConfirmExport.textContent = t('btn_download_now');
      btnConfirmExport.disabled = false;
    }
  }
}

// Sync History View
async function loadSyncHistory() {
  tweetsContainer.innerHTML = '<div style="padding: 20px;">正在載入同步記錄...</div>';
  try {
    const res = await fetch(`${API_BASE}/history`);
    const data = await res.json();
    const history = data.history || [];

    if (history.length === 0) {
      tweetsContainer.innerHTML = '<div style="padding: 40px; color: #536471;">暫無同步記錄</div>';
      return;
    }

    let tableHtml = `
      <div style="grid-column: span 2; background: #FFFFFF; border: 1px solid #EFF3F4; border-radius: 12px; overflow: hidden; padding: 16px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #EFF3F4; color: #536471;">
              <th style="padding: 10px;">${t('history_th_id')}</th>
              <th style="padding: 10px;">${t('history_th_type')}</th>
              <th style="padding: 10px;">${t('history_th_added')}</th>
              <th style="padding: 10px;">${t('history_th_updated')}</th>
              <th style="padding: 10px;">${t('history_th_time')}</th>
              <th style="padding: 10px;">${t('history_th_details')}</th>
            </tr>
          </thead>
          <tbody>
    `;

    history.forEach(h => {
      const typeLabel = h.sync_type === 'bookmark' ? t('nav_bookmarks') : t('nav_likes');
      tableHtml += `
        <tr style="border-bottom: 1px solid #EFF3F4;">
          <td style="padding: 10px;">${h.id}</td>
          <td style="padding: 10px;"><strong style="color: ${h.sync_type === 'bookmark' ? '#1D9BF0' : '#E0245E'}">${typeLabel}</strong></td>
          <td style="padding: 10px; color: #00BA7C;">+${h.count_added}</td>
          <td style="padding: 10px; color: #536471;">${h.count_updated}</td>
          <td style="padding: 10px; color: #536471;">${h.timestamp.replace('T', ' ').slice(0, 19)}</td>
          <td style="padding: 10px;">${escapeHtml(h.details || '')}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table></div>`;
    tweetsContainer.innerHTML = tableHtml;
  } catch (err) {
    tweetsContainer.innerHTML = '<div style="padding: 20px; color: red;">載入同步記錄失敗</div>';
  }
}

function showSyncGuide() {
  syncGuideModal.style.display = 'flex';
}

function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
