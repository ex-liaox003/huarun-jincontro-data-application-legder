(function () {
  var data = window.CR_FINANCE_APP_DATA || { workbooks: [], reports: [] };
  var state = {
    activeReportId: null,
    activePlaceholder: null,
    activeCompany: "全部",
    query: ""
  };

  var el = {
    navTree: document.getElementById("navTree"),
    reportGrid: document.getElementById("reportGrid"),
    reportPanel: document.getElementById("reportPanel"),
    searchInput: document.getElementById("searchInput"),
    companyFilter: document.getElementById("companyFilter"),
    totalReports: document.getElementById("totalReports"),
    totalBooks: document.getElementById("totalBooks"),
    totalCompanies: document.getElementById("totalCompanies"),
    generatedAt: document.getElementById("generatedAt"),
    homeButton: document.getElementById("homeButton"),
    pageTitle: document.getElementById("pageTitle"),
    pageSub: document.getElementById("pageSub")
  };

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function companyList() {
    var seen = {};
    data.workbooks.forEach(function (book) { seen[book.company] = true; });
    return Object.keys(seen);
  }

  function reportsByCompany(company) {
    return data.reports.filter(function (report) { return report.company === company; });
  }

  function strategyTopics(company) {
    return reportsByCompany(company).map(function (report) {
      return {
        title: report.title,
        category: report.category,
        reportId: report.id
      };
    });
  }

  function genericTopics(department, company) {
    var topicMap = {
      "财务部": {
        "华润信托": ["财务月报", "预算执行", "资金分析"],
        "华润保险经纪": ["财务月报", "预算执行", "收入利润分析"],
        "华润融资租赁": ["财务月报", "融资台账", "预算执行"],
        "华润银行": ["资产负债分析", "损益分析", "成本分析", "预算执行"]
      },
      "风险部": {
        "华润信托": ["风险监测", "预警清单", "风险限额"],
        "华润保险经纪": ["风险监测", "预警清单", "业务风险"],
        "华润融资租赁": ["信用风险", "流动性风险", "预警清单"],
        "华润银行": ["信用风险", "市场风险", "流动性风险", "风险预警"]
      },
      "法律合规部": {
        "华润信托": ["合规检查", "法律事项", "整改跟踪"],
        "华润保险经纪": ["合规检查", "法律事项", "监管报送"],
        "华润融资租赁": ["合规检查", "法律事项", "合同管理"],
        "华润银行": ["合规检查", "法律事项", "监管报送", "整改跟踪"]
      }
    };
    return (topicMap[department][company] || []).map(function (title) {
      return {
        title: title,
        category: "目录预留",
        placeholder: true,
        department: department,
        company: company
      };
    });
  }

  function departmentStructure() {
    var companies = companyList();
    var departments = [
      {
        name: "战略部",
        subtitle: "战略指标、经营对标、结构分析",
        companies: companies.map(function (company) {
          return { name: company, topics: strategyTopics(company) };
        })
      },
      {
        name: "财务部",
        subtitle: "财务月报、预算、资金、损益",
        companies: companies.map(function (company) {
          return { name: company, topics: genericTopics("财务部", company) };
        })
      },
      {
        name: "风险部",
        subtitle: "风险监测、预警、限额、风险画像",
        companies: companies.map(function (company) {
          return { name: company, topics: genericTopics("风险部", company) };
        })
      },
      {
        name: "法律合规部",
        subtitle: "合规检查、法律事项、监管报送",
        companies: companies.map(function (company) {
          return { name: company, topics: genericTopics("法律合规部", company) };
        })
      }
    ];
    return departments;
  }

  function findReport(id) {
    return data.reports.find(function (report) { return report.id === id; });
  }

  function filteredReports() {
    var q = state.query.trim().toLowerCase();
    return data.reports.filter(function (report) {
      var matchCompany = state.activeCompany === "全部" || report.company === state.activeCompany;
      var text = [report.title, report.sheetName, report.workbook, report.company, report.category].join(" ").toLowerCase();
      return matchCompany && (!q || text.indexOf(q) >= 0);
    });
  }

  function statusClass(status) {
    if (status === "已读取数据") return "ok";
    if (status === "模板标题") return "draft";
    return "empty";
  }

  function renderKpis() {
    var companies = companyList();
    el.totalReports.textContent = data.reports.length;
    el.totalBooks.textContent = departmentStructure().length;
    el.totalCompanies.textContent = companies.length;
    el.generatedAt.textContent = data.generatedAt || "本地生成";
  }

  function renderCompanyFilter() {
    var companies = ["全部"].concat(companyList());
    el.companyFilter.innerHTML = companies.map(function (company) {
      return '<button class="chip ' + (company === state.activeCompany ? "active" : "") + '" data-company="' + escapeHtml(company) + '">' + escapeHtml(company) + '</button>';
    }).join("");
  }

  function renderNav() {
    var html = '<div class="side-caption">结构目录</div>' + departmentStructure().map(function (department) {
      var topicCount = department.companies.reduce(function (sum, company) {
        return sum + company.topics.length;
      }, 0);
      return '<section class="dept-nav">' +
        '<button class="dept-head" data-placeholder-topic="' + escapeHtml(department.name) + '|集团层面|部门总览">' +
        '<span>' + escapeHtml(department.name) + '<small style="display:block;color:var(--muted);font-weight:400;">' + escapeHtml(department.subtitle) + '</small></span>' +
        '<em>' + topicCount + '</em>' +
        '</button>' +
        department.companies.map(function (company) {
          return '<div class="company-node">' +
            '<div class="company-title"><span>' + escapeHtml(company.name) + '</span><em>' + company.topics.length + '</em></div>' +
            '<div class="topic-list">' +
            company.topics.map(function (topic) {
              if (topic.reportId) {
                return '<button class="topic-link ' + (topic.reportId === state.activeReportId ? "active" : "") + '" data-report-id="' + topic.reportId + '">' + escapeHtml(topic.title) + '</button>';
              }
              return '<button class="topic-link placeholder" data-placeholder-topic="' + escapeHtml(department.name + "|" + company.name + "|" + topic.title) + '">' + escapeHtml(topic.title) + '</button>';
            }).join("") +
            '</div>' +
          '</div>';
        }).join("") +
      '</section>';
    }).join("");
    el.navTree.innerHTML = html;
  }

  function renderStructureDirectory() {
    return '<section class="home-panel" style="margin-bottom:18px;">' +
      '<div class="section-title"><h2>结构目录</h2><p>部门 > 子公司 > 主题报表</p></div>' +
      '<div class="structure-grid">' +
      departmentStructure().map(function (department) {
        return '<article class="structure-card">' +
          '<h3>' + escapeHtml(department.name) + '</h3>' +
          department.companies.map(function (company) {
            return '<div class="structure-company">' +
              '<strong>' + escapeHtml(company.name) + '</strong>' +
              '<div class="structure-topics">' +
              company.topics.map(function (topic) {
                if (topic.reportId) {
                  return '<button class="mini-topic real" data-report-id="' + topic.reportId + '">' + escapeHtml(topic.title) + '</button>';
                }
                return '<button class="mini-topic" data-placeholder-topic="' + escapeHtml(department.name + "|" + company.name + "|" + topic.title) + '">' + escapeHtml(topic.title) + '</button>';
              }).join("") +
              '</div>' +
            '</div>';
          }).join("") +
        '</article>';
      }).join("") +
      '</div>' +
    '</section>';
  }

  function renderCards() {
    var reports = filteredReports();
    el.reportGrid.innerHTML = reports.map(function (report) {
      return '<article class="report-card" data-report-id="' + report.id + '">' +
        '<div class="card-top"><span class="tag">' + escapeHtml(report.company) + '</span><span class="status ' + statusClass(report.status) + '">' + escapeHtml(report.status) + '</span></div>' +
        '<h3>' + escapeHtml(report.title) + '</h3>' +
        '<p>' + escapeHtml(report.workbook) + ' / ' + escapeHtml(report.sheetName) + '</p>' +
        '<div class="card-meta"><span>' + escapeHtml(report.category) + '</span><span>' + report.rowCount + ' 行 · ' + report.colCount + ' 列</span></div>' +
      '</article>';
    }).join("");
    if (!reports.length) {
      el.reportGrid.innerHTML = '<div class="empty-card">没有找到匹配的报表，请调整搜索条件或子公司筛选。</div>';
    }
  }

  function renderTable(report) {
    if (!report.data || !report.data.length || report.filledCells <= 1) {
      return '<div class="empty-state">' +
        '<h3>该报表当前只有模板标题或暂无明细数据</h3>' +
        '<p>系统已按 sheet 建立独立报表入口。后续只要在源 Excel 的这个 sheet 中补充指标行，重新生成页面后即可展示明细表格。</p>' +
        '</div>';
    }
    var maxCols = Math.max.apply(null, report.data.map(function (row) { return row.length; }));
    var rows = report.data.map(function (row, rowIndex) {
      var cells = [];
      for (var i = 0; i < maxCols; i += 1) {
        var tag = rowIndex === 0 ? "th" : "td";
        cells.push("<" + tag + ">" + escapeHtml(row[i] || "") + "</" + tag + ">");
      }
      return "<tr>" + cells.join("") + "</tr>";
    }).join("");
    return '<div class="table-wrap"><table>' + rows + '</table></div>';
  }

  function renderReport(reportId) {
    state.activeReportId = reportId;
    state.activePlaceholder = null;
    var report = findReport(reportId);
    if (!report) return renderHome();
    location.hash = reportId;
    el.pageTitle.textContent = report.title;
    el.pageSub.textContent = "战略部 > " + report.company + " > " + report.title + " · Sheet：" + report.sheetName;
    el.reportPanel.innerHTML = '<section class="report-detail">' +
      '<div class="detail-head">' +
      '<div><span class="tag">' + escapeHtml(report.company) + '</span><span class="tag muted">' + escapeHtml(report.category) + '</span><span class="status ' + statusClass(report.status) + '">' + escapeHtml(report.status) + '</span></div>' +
      '<a class="source-link" href="' + encodeURI(report.sourceLink) + '" target="_blank" rel="noopener">打开源工作簿</a>' +
      '</div>' +
      '<div class="detail-kpis">' +
      '<div><b>' + report.rowCount + '</b><span>行数</span></div>' +
      '<div><b>' + report.colCount + '</b><span>列数</span></div>' +
      '<div><b>' + report.filledCells + '</b><span>非空单元格</span></div>' +
      '<div><b>' + escapeHtml(report.sheetName) + '</b><span>源 sheet</span></div>' +
      '</div>' +
      renderTable(report) +
      '</section>';
    renderNav();
  }

  function renderPlaceholder(topicKey) {
    var parts = String(topicKey || "").split("|");
    var department = parts[0] || "部门专区";
    var company = parts[1] || "子公司";
    var topic = parts[2] || "主题报表";
    state.activeReportId = null;
    state.activePlaceholder = topicKey;
    location.hash = "";
    el.pageTitle.textContent = topic;
    el.pageSub.textContent = department + " > " + company + " > " + topic;
    el.reportPanel.innerHTML = '<section class="report-detail">' +
      '<div class="detail-head">' +
      '<div><span class="tag">' + escapeHtml(department) + '</span><span class="tag muted">' + escapeHtml(company) + '</span><span class="status draft">目录已预留</span></div>' +
      '</div>' +
      '<div class="empty-state">' +
      '<h3>该主题报表已加入结构目录</h3>' +
      '<p>当前页面先完成“部门 > 子公司 > 主题报表”的业务目录搭建。后续接入对应 Excel、观远数据集或 BI 页面后，可以把该入口改为真实报表页面。</p>' +
      '</div>' +
      '</section>';
    renderNav();
  }

  function renderHome() {
    state.activeReportId = null;
    state.activePlaceholder = null;
    history.replaceState(null, "", location.pathname);
    el.pageTitle.textContent = "华润金控数据应用中心";
    el.pageSub.textContent = "按部门、子公司、主题报表组织目录；战略部主题报表已从 Excel sheet 拆分为独立页面";
    el.reportPanel.innerHTML = renderStructureDirectory() + '<section class="home-panel"><div class="section-title"><h2>战略部实际报表入口</h2><p>点击卡片进入对应 sheet 报表</p></div><div id="reportGrid" class="report-grid"></div></section>';
    el.reportGrid = document.getElementById("reportGrid");
    renderCards();
    renderNav();
  }

  function bindEvents() {
    document.addEventListener("click", function (event) {
      var reportButton = event.target.closest("[data-report-id]");
      if (reportButton) {
        renderReport(reportButton.getAttribute("data-report-id"));
        return;
      }
      var placeholderButton = event.target.closest("[data-placeholder-topic]");
      if (placeholderButton) {
        renderPlaceholder(placeholderButton.getAttribute("data-placeholder-topic"));
        return;
      }
      var companyButton = event.target.closest("[data-company]");
      if (companyButton) {
        state.activeCompany = companyButton.getAttribute("data-company");
        renderCompanyFilter();
        renderHome();
      }
    });
    el.searchInput.addEventListener("input", function () {
      state.query = el.searchInput.value;
      if (!state.activeReportId && document.getElementById("reportGrid")) renderCards();
    });
    el.homeButton.addEventListener("click", renderHome);
  }

  function init() {
    renderKpis();
    renderCompanyFilter();
    bindEvents();
    var hashId = location.hash.replace("#", "");
    if (hashId && findReport(hashId)) {
      renderReport(hashId);
    } else {
      renderHome();
    }
  }

  init();
})();
