const {
    Plugin,
    Setting,
    fetchSyncPost,
    openTab,
    openMobileFileById,
    getFrontend,
    showMessage,
} = require("siyuan");

const STORAGE_NAME = "config.json";
const SETTINGS_ICON_ID = "iconSuishiCalendarSettings";
const SETTINGS_ICON_SYMBOL = `<symbol id="${SETTINGS_ICON_ID}" viewBox="0 0 24 24">
  <path d="M7 2.75a.75.75 0 0 1 .75.75v1h8.5v-1a.75.75 0 0 1 1.5 0v1H19A2.75 2.75 0 0 1 21.75 8v9A2.75 2.75 0 0 1 19 19.75H5A2.75 2.75 0 0 1 2.25 17V8A2.75 2.75 0 0 1 5 5.25h1.25v-1A.75.75 0 0 1 7 2.75zm10.75 4H17v.75a.75.75 0 0 1-1.5 0v-.75h-7v.75a.75.75 0 1 1-1.5 0v-.75H6A1.25 1.25 0 0 0 4.75 8v.25h14.5V8A1.25 1.25 0 0 0 18 6.75h-.25zM4.75 9.75V17A1.25 1.25 0 0 0 6 18.25h12A1.25 1.25 0 0 0 19.25 17V9.75H4.75z" fill="currentColor"/>
  <path d="M7.75 12.25h2v2h-2zm3.25 0h2v2h-2zm-3.25 3.25h2v2h-2z" fill="currentColor" opacity=".7"/>
  <path d="M16.65 11.15a.75.75 0 0 1 .7.48l.18.46.46.18a.75.75 0 0 1 0 1.4l-.46.18-.18.46a.75.75 0 0 1-1.4 0l-.18-.46-.46-.18a.75.75 0 0 1 0-1.4l.46-.18.18-.46a.75.75 0 0 1 .7-.48z" fill="currentColor"/>
</symbol>`;
const DEFAULT_CONFIG = {
    notebookId: "",
    weekStart: 1, // 0 = Sunday, 1 = Monday
    showWeekNumber: true,
    fontMode: "siyuan", // siyuan | sidebar | fixed
    fixedFontSize: 13,
    fontOffset: 0, // used in `siyuan` mode with Ctrl + wheel
    enableCtrlWheelAdjust: true,
    quarterLabelMode: "number", // number | season
    dotWordThreshold: 200,
    appearanceStyle: "card", // card | minimal
};

const DEFAULT_DAILY_NOTE_PATH = "/daily note/{{now | date \"2006/01\"}}/{{now | date \"2006-01-02\"}}";

const SOLAR_HOLIDAYS = {
    "01-01": "元旦",
    "05-01": "劳动节",
    "10-01": "国庆节",
};

const LUNAR_HOLIDAYS = {
    "1-1": "春节",
    "1-15": "元宵",
    "5-5": "端午",
    "7-7": "七夕",
    "8-15": "中秋",
    "9-9": "重阳",
    "12-8": "腊八",
};

// 国务院办公厅：2026 年节假日安排
const OFFICIAL_HOLIDAY_2026_RANGES = [
    { name: "元旦", start: "2026-01-01", end: "2026-01-03" },
    { name: "春节", start: "2026-02-15", end: "2026-02-23" },
    { name: "清明", start: "2026-04-04", end: "2026-04-06" },
    { name: "劳动节", start: "2026-05-01", end: "2026-05-05" },
    { name: "端午", start: "2026-06-19", end: "2026-06-21" },
    { name: "中秋", start: "2026-09-25", end: "2026-09-27" },
    { name: "国庆", start: "2026-10-01", end: "2026-10-08" },
];

const OFFICIAL_WORKDAYS_2026 = [
    "2026-02-14",
    "2026-02-28",
    "2026-05-09",
    "2026-09-20",
    "2026-10-10",
];

const SOLAR_TERM_NAMES = [
    "小寒",
    "大寒",
    "立春",
    "雨水",
    "惊蛰",
    "春分",
    "清明",
    "谷雨",
    "立夏",
    "小满",
    "芒种",
    "夏至",
    "小暑",
    "大暑",
    "立秋",
    "处暑",
    "白露",
    "秋分",
    "寒露",
    "霜降",
    "立冬",
    "小雪",
    "大雪",
    "冬至",
];

const SOLAR_TERM_INFO = [
    0, 21208, 42467, 63836, 85337, 107014,
    128867, 150921, 173149, 195551, 218072, 240693,
    263343, 285989, 308563, 331033, 353350, 375494,
    397447, 419210, 440795, 462224, 483532, 504758,
];

const LUNAR_MONTH_MAP = {
    正月: 1,
    二月: 2,
    三月: 3,
    四月: 4,
    五月: 5,
    六月: 6,
    七月: 7,
    八月: 8,
    九月: 9,
    十月: 10,
    冬月: 11,
    十一月: 11,
    腊月: 12,
    十二月: 12,
};

const LUNAR_DAY_TEXT = [
    "",
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十",
];

const GO_DATE_TOKENS = [
    "2006",
    "15",
    "03",
    "04",
    "05",
    "06",
    "01",
    "02",
    "3",
    "4",
    "5",
    "1",
    "2",
];

const QUARTER_SEASON_LABELS = ["春季", "夏季", "秋季", "冬季"];

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function normalizeNumber(value, fallback, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return clamp(num, min, max);
}

function pad2(value) {
    return String(value).padStart(2, "0");
}

function formatDateKey(date) {
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

function formatDateString(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateString(dateString) {
    const [year, month, day] = dateString.split("-").map((value) => Number(value));
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function expandDateRange(start, end) {
    const result = [];
    let cursor = parseDateString(start);
    const endDate = parseDateString(end);
    while (cursor <= endDate) {
        result.push(formatDateString(cursor));
        cursor = addDays(cursor, 1);
    }
    return result;
}

function buildHolidaySchedule2026() {
    const offDates = new Set();
    OFFICIAL_HOLIDAY_2026_RANGES.forEach((range) => {
        expandDateRange(range.start, range.end).forEach((dateKey) => offDates.add(dateKey));
    });
    const workDates = new Set(OFFICIAL_WORKDAYS_2026);
    return { offDates, workDates };
}

function getWeekLabels(weekStart) {
    const labels = ["日", "一", "二", "三", "四", "五", "六"];
    return labels.slice(weekStart).concat(labels.slice(0, weekStart));
}

function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatGoDate(date, layout) {
    const hour24 = date.getHours();
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const replacements = {
        "2006": String(date.getFullYear()),
        "06": String(date.getFullYear()).slice(-2),
        "01": pad2(date.getMonth() + 1),
        "1": String(date.getMonth() + 1),
        "02": pad2(date.getDate()),
        "2": String(date.getDate()),
        "15": pad2(hour24),
        "03": pad2(hour12),
        "3": String(hour12),
        "04": pad2(date.getMinutes()),
        "4": String(date.getMinutes()),
        "05": pad2(date.getSeconds()),
        "5": String(date.getSeconds()),
    };

    let output = "";
    for (let i = 0; i < layout.length; ) {
        let matched = false;
        for (const token of GO_DATE_TOKENS) {
            if (layout.startsWith(token, i)) {
                output += replacements[token];
                i += token.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            output += layout[i];
            i += 1;
        }
    }
    return output;
}

function renderDailyNotePath(template, date) {
    return template.replace(/{{\s*now\s*\|\s*date\s*"([^"]+)"\s*}}/g, (_, layout) => {
        return formatGoDate(date, layout);
    });
}

function joinPathSegments(...segments) {
    return segments
        .filter((segment) => typeof segment === "string" && segment.trim() !== "")
        .map((segment, index) => {
            const normalized = segment.replace(/\\/g, "/");
            if (index === 0) {
                return normalized.replace(/\/+$/, "");
            }
            return normalized.replace(/^\/+/, "").replace(/\/+$/, "");
        })
        .filter(Boolean)
        .join("/");
}

function createLunarFormatter() {
    try {
        return new Intl.DateTimeFormat("zh-u-ca-chinese", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
        });
    } catch {
        return null;
    }
}

function extractDateKeyFromIAL(ialText) {
    const match = String(ialText || "").match(/custom-dailynote-(\d{8})/);
    if (!match) return "";
    const raw = match[1];
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function countVisibleChars(markdown) {
    const text = String(markdown || "")
        .replace(/^---[\s\S]*?---\s*/m, " ")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ")
        .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/[#>*_\-\[\]()`]/g, " ")
        .replace(/\s+/g, "");
    return text.length;
}

module.exports = class TraditionalCalendarPlugin extends Plugin {
    getPluginTitle() {
        return this.i18n?.pluginName || "SuiShi Calendar";
    }

    getOpenSettingsText() {
        return this.i18n?.openSettings || "Open SuiShi Calendar Settings";
    }

    async onload() {
        this.config = {
            ...DEFAULT_CONFIG,
            ...(await this.loadData(STORAGE_NAME)),
        };
        this.normalizeConfig();

        const frontend = typeof getFrontend === "function" ? getFrontend() : "desktop";
        this.isMobile = ["mobile", "browser-mobile"].includes(frontend);

        this.solarTermCache = new Map();
        this.lunarFormatter = createLunarFormatter();
        this.holidaySchedule = buildHolidaySchedule2026();

        this.notebookSelect = null;
        this.weekStartSelect = null;
        this.showWeekNumberCheckbox = null;
        this.fontModeSelect = null;
        this.fixedFontSizeInput = null;
        this.quickAdjustCheckbox = null;
        this.quarterLabelSelect = null;
        this.dotThresholdInput = null;
        this.appearanceStyleSelect = null;
        this.topBarSetting = null;
        this.settingDraft = null;
        this.settingCommitted = false;

        this.calendarHost = null;
        this.calendarRoot = null;
        this.calendarGrid = null;
        this.calendarTitle = null;
        this.calendarMonth = null;
        this.calendarQuarter = null;
        this.calendarWeek = null;

        this.monthDiaryKey = "";
        this.monthDiaryMap = new Map(); // date => { id, charCount }
        this.docWordCache = new Map(); // key: `${docId}:${updated}`
        this.renderSeq = 0;
        this.selectedDateKey = formatDateString(new Date());

        this.resizeObserver = null;
        this.rootMutationObserver = null;
        this.saveConfigTimer = null;
        this.refreshCalendarTimer = null;
        this.pendingDateClickTimer = null;

        this.handleWheel = this.handleWheel.bind(this);
        this.handleRootMutation = this.handleRootMutation.bind(this);
        this.handleWindowFocus = this.handleWindowFocus.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleCalendarCellClick = this.handleCalendarCellClick.bind(this);
        this.handleCalendarCellDoubleClick = this.handleCalendarCellDoubleClick.bind(this);

        this.addIcons(SETTINGS_ICON_SYMBOL);
        this.initDock();
        this.initSetting();
        this.addCommand({
            langKey: "openSuishiCalendarSettings",
            langText: this.getOpenSettingsText(),
            hotkey: "",
            callback: () => {
                this.openPluginSettings();
            },
        });
        this.topBarSetting = this.addTopBar({
            icon: SETTINGS_ICON_ID,
            title: this.getOpenSettingsText(),
            position: "right",
            callback: () => {
                this.openPluginSettings();
            },
        });
        this.observeRootStyleChanges();
        if (typeof window !== "undefined") {
            window.addEventListener("focus", this.handleWindowFocus);
        }
        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", this.handleVisibilityChange);
        }
    }

    onunload() {
        this.unmountCalendar();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.rootMutationObserver) {
            this.rootMutationObserver.disconnect();
            this.rootMutationObserver = null;
        }
        if (this.saveConfigTimer) {
            clearTimeout(this.saveConfigTimer);
            this.saveConfigTimer = null;
        }
        if (this.refreshCalendarTimer) {
            clearTimeout(this.refreshCalendarTimer);
            this.refreshCalendarTimer = null;
        }
        if (this.pendingDateClickTimer) {
            clearTimeout(this.pendingDateClickTimer);
            this.pendingDateClickTimer = null;
        }
        if (this.topBarSetting) {
            this.topBarSetting.remove();
            this.topBarSetting = null;
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("focus", this.handleWindowFocus);
        }
        if (typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        }
    }

    async uninstall() {
        await this.removeData(STORAGE_NAME);
    }

    normalizeConfig() {
        const fontModes = new Set(["siyuan", "sidebar", "fixed"]);
        const quarterModes = new Set(["number", "season"]);
        const appearanceStyles = new Set(["card", "minimal"]);
        if (!fontModes.has(this.config.fontMode)) this.config.fontMode = DEFAULT_CONFIG.fontMode;
        if (!quarterModes.has(this.config.quarterLabelMode)) this.config.quarterLabelMode = DEFAULT_CONFIG.quarterLabelMode;
        if (!appearanceStyles.has(this.config.appearanceStyle)) this.config.appearanceStyle = DEFAULT_CONFIG.appearanceStyle;
        this.config.weekStart = Math.round(normalizeNumber(this.config.weekStart, DEFAULT_CONFIG.weekStart, 0, 6));
        this.config.showWeekNumber = this.config.showWeekNumber !== false;
        this.config.fixedFontSize = normalizeNumber(this.config.fixedFontSize, DEFAULT_CONFIG.fixedFontSize, 10, 24);
        this.config.fontOffset = normalizeNumber(this.config.fontOffset, DEFAULT_CONFIG.fontOffset, -8, 12);
        this.config.dotWordThreshold = normalizeNumber(this.config.dotWordThreshold, DEFAULT_CONFIG.dotWordThreshold, 20, 5000);
        this.config.enableCtrlWheelAdjust = this.config.enableCtrlWheelAdjust !== false;
    }

    async saveConfig() {
        this.normalizeConfig();
        await this.saveData(STORAGE_NAME, this.config);
    }

    scheduleSaveConfig() {
        if (this.saveConfigTimer) clearTimeout(this.saveConfigTimer);
        this.saveConfigTimer = setTimeout(() => {
            this.saveConfig();
            this.saveConfigTimer = null;
        }, 250);
    }

    openPluginSettings() {
        this.beginSettingSession();
        if (this.setting && typeof this.setting.open === "function") {
            this.setting.open(this.getPluginTitle());
        }
        this.syncSettingUI();
        this.refreshNotebookOptions();
    }

    initDock() {
        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 320, height: 0 },
                icon: "iconCalendar",
                title: "岁时日历",
            },
            data: {},
            type: "traditional_calendar_dock",
            init: (dock) => {
                this.mountCalendar(dock.element);
            },
            destroy: () => {
                this.unmountCalendar();
            },
            update: () => {
                this.applyFontSizing();
                this.renderCalendar();
            },
        });
    }

    initSetting() {
        this.setting = new Setting({
            destroyCallback: () => {
                this.discardSettingSession();
            },
            confirmCallback: async () => {
                await this.commitSettingSession();
            },
        });

        this.setting.addItem({
            title: "日记本",
            description: "选择日记所属的笔记本",
            createActionElement: () => {
                const select = document.createElement("select");
                select.className = "b3-select fn__block";
                select.disabled = true;
                select.addEventListener("change", () => {
                    const draft = this.getEditableSettingConfig();
                    draft.notebookId = select.value;
                });
                this.notebookSelect = select;
                this.refreshNotebookOptions();
                return select;
            },
        });

        this.setting.addItem({
            title: "显示周数",
            description: "是否在左侧显示 ISO 周数",
            createActionElement: () => {
                const input = document.createElement("input");
                input.className = "b3-switch fn__flex-center";
                input.type = "checkbox";
                input.checked = this.config.showWeekNumber !== false;
                input.addEventListener("change", () => {
                    const draft = this.getEditableSettingConfig();
                    draft.showWeekNumber = input.checked;
                });
                this.showWeekNumberCheckbox = input;
                return input;
            },
        });

        this.setting.addItem({
            title: "每周起始日",
            description: "设置日历每周从星期几开始",
            createActionElement: () => {
                const select = document.createElement("select");
                select.className = "b3-select fn__block";
                select.innerHTML = `
                    <option value="1">周一</option>
                    <option value="0">周日</option>
                    <option value="2">周二</option>
                    <option value="3">周三</option>
                    <option value="4">周四</option>
                    <option value="5">周五</option>
                    <option value="6">周六</option>
                `;
                select.value = String(this.config.weekStart);
                select.addEventListener("change", () => {
                    const draft = this.getEditableSettingConfig();
                    draft.weekStart = Math.round(normalizeNumber(select.value, DEFAULT_CONFIG.weekStart, 0, 6));
                    select.value = String(draft.weekStart);
                });
                this.weekStartSelect = select;
                return select;
            },
        });

        this.setting.addItem({
            title: "字体模式",
            description: "跟随 SiYuan / 跟随侧边栏 / 固定大小",
            createActionElement: () => {
                const select = document.createElement("select");
                select.className = "b3-select fn__block";
                select.innerHTML = `
                    <option value="siyuan">跟随 SiYuan</option>
                    <option value="sidebar">跟随侧边栏</option>
                    <option value="fixed">固定大小</option>
                `;
                select.value = this.config.fontMode;
                select.addEventListener("change", () => {
                    const draft = this.getEditableSettingConfig();
                    draft.fontMode = select.value;
                    this.refreshFixedFontSettingState();
                });
                this.fontModeSelect = select;
                return select;
            },
        });

        this.setting.addItem({
            title: "固定字号",
            description: "仅在固定大小模式生效（10-24）",
            createActionElement: () => {
                const input = document.createElement("input");
                input.className = "b3-text-field fn__block";
                input.type = "number";
                input.min = "10";
                input.max = "24";
                input.step = "1";
                input.value = String(this.config.fixedFontSize);
                const applyValue = () => {
                    const draft = this.getEditableSettingConfig();
                    draft.fixedFontSize = normalizeNumber(input.value, DEFAULT_CONFIG.fixedFontSize, 10, 24);
                    input.value = String(draft.fixedFontSize);
                };
                input.addEventListener("input", applyValue);
                input.addEventListener("change", applyValue);
                this.fixedFontSizeInput = input;
                this.refreshFixedFontSettingState();
                return input;
            },
        });

        this.setting.addItem({
            title: "Ctrl+滚轮调整",
            description: "仅在“跟随 SiYuan”模式下生效",
            createActionElement: () => {
                const input = document.createElement("input");
                input.className = "b3-switch fn__flex-center";
                input.type = "checkbox";
                input.checked = !!this.config.enableCtrlWheelAdjust;
                input.addEventListener("change", () => {
                    const draft = this.getEditableSettingConfig();
                    draft.enableCtrlWheelAdjust = input.checked;
                });
                this.quickAdjustCheckbox = input;
                return input;
            },
        });

        this.setting.addItem({
            title: "季度显示",
            description: "显示为“1季度”或“春夏秋冬”",
            createActionElement: () => {
                const select = document.createElement("select");
                select.className = "b3-select fn__block";
                select.innerHTML = `
                    <option value="number">数字季度</option>
                    <option value="season">春夏秋冬</option>
                `;
                select.value = this.config.quarterLabelMode;
                select.addEventListener("change", () => {
                    const draft = this.getEditableSettingConfig();
                    draft.quarterLabelMode = select.value;
                });
                this.quarterLabelSelect = select;
                return select;
            },
        });

        this.setting.addItem({
            title: "界面风格",
            description: "卡片风格 / 极简风格",
            createActionElement: () => {
                const select = document.createElement("select");
                select.className = "b3-select fn__block";
                select.innerHTML = `
                    <option value="card">卡片风格</option>
                    <option value="minimal">极简风格</option>
                `;
                select.value = this.config.appearanceStyle;
                select.addEventListener("change", () => {
                    const draft = this.getEditableSettingConfig();
                    draft.appearanceStyle = select.value;
                });
                this.appearanceStyleSelect = select;
                return select;
            },
        });

        this.setting.addItem({
            title: "圆点字数阈值",
            description: "每达到阈值增加一个圆点，最多 3 个（默认 200）",
            createActionElement: () => {
                const input = document.createElement("input");
                input.className = "b3-text-field fn__block";
                input.type = "number";
                input.min = "20";
                input.max = "5000";
                input.step = "10";
                input.value = String(this.config.dotWordThreshold);
                const applyValue = () => {
                    const draft = this.getEditableSettingConfig();
                    draft.dotWordThreshold = normalizeNumber(input.value, DEFAULT_CONFIG.dotWordThreshold, 20, 5000);
                    input.value = String(draft.dotWordThreshold);
                };
                input.addEventListener("input", applyValue);
                input.addEventListener("change", applyValue);
                this.dotThresholdInput = input;
                return input;
            },
        });
    }

    beginSettingSession() {
        this.settingDraft = { ...this.config };
        this.settingCommitted = false;
    }

    getEditableSettingConfig() {
        if (!this.settingDraft) {
            this.settingDraft = { ...this.config };
        }
        return this.settingDraft;
    }

    syncSettingUI() {
        const source = this.settingDraft || this.config;
        if (this.weekStartSelect) this.weekStartSelect.value = String(source.weekStart);
        if (this.showWeekNumberCheckbox) this.showWeekNumberCheckbox.checked = source.showWeekNumber !== false;
        if (this.fontModeSelect) this.fontModeSelect.value = source.fontMode;
        if (this.fixedFontSizeInput) this.fixedFontSizeInput.value = String(source.fixedFontSize);
        if (this.quickAdjustCheckbox) this.quickAdjustCheckbox.checked = !!source.enableCtrlWheelAdjust;
        if (this.quarterLabelSelect) this.quarterLabelSelect.value = source.quarterLabelMode;
        if (this.appearanceStyleSelect) this.appearanceStyleSelect.value = source.appearanceStyle;
        if (this.dotThresholdInput) this.dotThresholdInput.value = String(source.dotWordThreshold);
        if (this.notebookSelect && source.notebookId) this.notebookSelect.value = source.notebookId;
        this.refreshFixedFontSettingState();
    }

    async commitSettingSession() {
        const draft = this.settingDraft;
        if (!draft) return;
        this.config = {
            ...this.config,
            ...draft,
        };
        this.normalizeConfig();
        this.settingCommitted = true;
        this.settingDraft = null;
        this.refreshFixedFontSettingState();
        this.applyFontSizing();
        this.applyAppearanceStyle();
        this.applyWeekConfig();
        this.updateWeekRow();
        this.renderCalendar();
        await this.saveConfig();
    }

    discardSettingSession() {
        if (!this.settingCommitted) {
            this.settingDraft = null;
            this.syncSettingUI();
        }
        this.settingCommitted = false;
    }

    refreshFixedFontSettingState() {
        if (!this.fixedFontSizeInput) return;
        const source = this.settingDraft || this.config;
        this.fixedFontSizeInput.disabled = source.fontMode !== "fixed";
    }

    async refreshNotebookOptions() {
        const select = this.notebookSelect;
        if (!select) return;
        select.innerHTML = "";
        select.disabled = true;

        const notebooks = await this.loadNotebooks();
        if (!notebooks.length) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "未发现笔记本";
            select.appendChild(option);
            return;
        }

        notebooks.forEach((notebook) => {
            const option = document.createElement("option");
            option.value = notebook.id;
            option.textContent = notebook.name;
            const source = this.settingDraft || this.config;
            if (notebook.id === source.notebookId) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.disabled = false;
        const source = this.settingDraft || this.config;
        if (!source.notebookId && notebooks[0]) {
            source.notebookId = notebooks[0].id;
        }
        select.value = source.notebookId || notebooks[0].id;
    }

    async loadNotebooks() {
        try {
            const res = await fetchSyncPost("/api/notebook/lsNotebooks", {});
            if (!res || res.code !== 0) return [];
            return res.data?.notebooks || [];
        } catch {
            return [];
        }
    }

    mountCalendar(root) {
        this.calendarHost = root;
        root.innerHTML = `
            <div class="tc-calendar">
                <div class="tc-header">
                    <div class="tc-title"></div>
                    <div class="tc-quarter"></div>
                    <div class="tc-month"></div>
                    <div class="tc-nav">
                        <button class="tc-btn" data-action="prev" aria-label="上个月">‹</button>
                        <button class="tc-btn" data-action="today">今</button>
                        <button class="tc-btn" data-action="next" aria-label="下个月">›</button>
                    </div>
                </div>
                <div class="tc-week"></div>
                <div class="tc-grid"></div>
            </div>
        `;

        this.calendarRoot = root.querySelector(".tc-calendar");
        this.calendarGrid = root.querySelector(".tc-grid");
        this.calendarTitle = root.querySelector(".tc-title");
        this.calendarMonth = root.querySelector(".tc-month");
        this.calendarQuarter = root.querySelector(".tc-quarter");
        this.calendarWeek = root.querySelector(".tc-week");
        this.applyAppearanceStyle();
        this.applyWeekConfig();

        this.updateWeekRow();

        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        this.selectedDateKey = formatDateString(now);

        root.querySelectorAll(".tc-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const action = btn.getAttribute("data-action");
                if (action === "prev") this.shiftMonth(-1);
                if (action === "next") this.shiftMonth(1);
                if (action === "today") this.goToday();
            });
        });

        this.calendarGrid.addEventListener("click", this.handleCalendarCellClick);
        this.calendarGrid.addEventListener("dblclick", this.handleCalendarCellDoubleClick);

        this.calendarRoot.addEventListener("wheel", this.handleWheel, { passive: false });
        this.installResizeObserver();
        this.applyFontSizing();
        this.renderCalendar();
    }

    unmountCalendar() {
        if (this.calendarRoot) {
            this.calendarRoot.removeEventListener("wheel", this.handleWheel);
        }
        if (this.pendingDateClickTimer) {
            clearTimeout(this.pendingDateClickTimer);
            this.pendingDateClickTimer = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.calendarHost) {
            this.calendarHost.innerHTML = "";
        }
        this.calendarHost = null;
        this.calendarRoot = null;
        this.calendarGrid = null;
        this.calendarTitle = null;
        this.calendarMonth = null;
        this.calendarQuarter = null;
        this.calendarWeek = null;
    }

    updateWeekRow() {
        if (!this.calendarWeek) return;
        this.applyWeekConfig();
        const weekLabels = getWeekLabels(this.config.weekStart);
        if (this.config.showWeekNumber !== false) {
            this.calendarWeek.innerHTML =
                `<div class="tc-weekhead">周</div>` +
                weekLabels.map((label) => `<div class="tc-weekday">${label}</div>`).join("");
            return;
        }
        this.calendarWeek.innerHTML = weekLabels.map((label) => `<div class="tc-weekday">${label}</div>`).join("");
    }

    applyWeekConfig() {
        if (!this.calendarRoot) return;
        const showWeekNumber = this.config.showWeekNumber !== false ? "true" : "false";
        this.calendarRoot.setAttribute("data-show-weeknum", showWeekNumber);
        // keep a second attribute for compatibility with older CSS selectors
        this.calendarRoot.setAttribute("data-show-week-number", showWeekNumber);
    }

    installResizeObserver() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (!this.calendarHost || typeof ResizeObserver === "undefined") return;
        this.resizeObserver = new ResizeObserver(() => {
            if (this.config.fontMode === "sidebar") {
                this.applyFontSizing();
            }
        });
        this.resizeObserver.observe(this.calendarHost);
    }

    observeRootStyleChanges() {
        if (typeof MutationObserver === "undefined") return;
        const root = document.documentElement;
        if (!root) return;
        this.rootMutationObserver = new MutationObserver(this.handleRootMutation);
        this.rootMutationObserver.observe(root, {
            attributes: true,
            attributeFilter: ["style", "class"],
        });
        if (document.body) {
            this.rootMutationObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ["style", "class"],
            });
        }
    }

    handleRootMutation() {
        if (this.config.fontMode === "siyuan") {
            this.applyFontSizing();
        }
    }

    handleCalendarCellClick(event) {
        const cell = event.target.closest(".tc-cell");
        if (!cell || !cell.dataset.date) return;

        const dateKey = cell.dataset.date;
        if (this.pendingDateClickTimer) {
            clearTimeout(this.pendingDateClickTimer);
        }
        this.pendingDateClickTimer = setTimeout(() => {
            this.pendingDateClickTimer = null;
            this.selectedDateKey = dateKey;
            this.renderCalendar();
            this.openDailyNoteByDate(dateKey);
        }, 260);
    }

    handleCalendarCellDoubleClick(event) {
        const cell = event.target.closest(".tc-cell");
        if (!cell || !cell.dataset.date) return;

        if (this.pendingDateClickTimer) {
            clearTimeout(this.pendingDateClickTimer);
            this.pendingDateClickTimer = null;
        }
        this.selectedDateKey = cell.dataset.date;
        this.renderCalendar();
        this.refreshCalendarData({ showMessageOnSuccess: true }).catch(() => {
            // Error message is already handled inside refreshCalendarData.
        });
    }

    handleWindowFocus() {
        this.scheduleCalendarRefresh();
    }

    handleVisibilityChange() {
        if (document.visibilityState === "visible") {
            this.scheduleCalendarRefresh();
        }
    }

    invalidateDiaryCaches() {
        this.monthDiaryKey = "";
        this.monthDiaryMap = new Map();
        this.docWordCache.clear();
    }

    scheduleCalendarRefresh() {
        if (this.refreshCalendarTimer) clearTimeout(this.refreshCalendarTimer);
        this.refreshCalendarTimer = setTimeout(() => {
            this.refreshCalendarTimer = null;
            this.refreshCalendarData().catch(() => {
                // Ignore passive refresh failures to avoid interrupting editing.
            });
        }, 180);
    }

    async refreshCalendarData(options = {}) {
        const { showMessageOnSuccess = false } = options;
        this.invalidateDiaryCaches();
        if (!this.calendarGrid) return;
        try {
            await this.renderCalendar();
            if (showMessageOnSuccess) {
                showMessage("日记状态已刷新", 2000, "info");
            }
        } catch (error) {
            if (showMessageOnSuccess) {
                showMessage(`刷新失败：${error.message || error}`, 3000, "error");
            }
            throw error;
        }
    }

    handleWheel(event) {
        if (this.config.fontMode !== "siyuan") return;
        if (!this.config.enableCtrlWheelAdjust) return;
        if (!event.ctrlKey) return;

        event.preventDefault();
        const step = event.deltaY < 0 ? 1 : -1;
        const next = clamp((this.config.fontOffset || 0) + step, -8, 12);
        if (next === this.config.fontOffset) return;

        this.config.fontOffset = next;
        this.applyFontSizing();
        this.scheduleSaveConfig();
    }

    getSiyuanFontSize() {
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const base = Number.isFinite(rootSize) ? rootSize : 14;
        return clamp(base + (this.config.fontOffset || 0), 10, 24);
    }

    getSidebarFontSize() {
        const width =
            this.calendarHost?.clientWidth ||
            this.calendarRoot?.clientWidth ||
            320;
        // 320 宽度约等于 13px
        return clamp(Math.round(width / 24), 10, 18);
    }

    applyFontSizing() {
        if (!this.calendarRoot) return;
        let fontSize = this.config.fixedFontSize;
        if (this.config.fontMode === "siyuan") {
            fontSize = this.getSiyuanFontSize();
        } else if (this.config.fontMode === "sidebar") {
            fontSize = this.getSidebarFontSize();
        } else {
            fontSize = this.config.fixedFontSize;
        }
        this.calendarRoot.style.setProperty("--tc-font-size", `${fontSize}px`);
    }

    applyAppearanceStyle() {
        if (!this.calendarRoot) return;
        const style = this.config.appearanceStyle === "minimal" ? "minimal" : "card";
        this.calendarRoot.dataset.style = style;
    }

    shiftMonth(offset) {
        let year = this.currentYear;
        let month = this.currentMonth + offset;
        if (month < 0) {
            month = 11;
            year -= 1;
        } else if (month > 11) {
            month = 0;
            year += 1;
        }
        this.currentYear = year;
        this.currentMonth = month;
        this.renderCalendar();
    }

    goToday() {
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        this.selectedDateKey = formatDateString(now);
        this.renderCalendar();
    }

    async loadMonthDiaryMap(year, month) {
        const monthKey = `${year}-${pad2(month + 1)}`;
        if (this.monthDiaryKey === monthKey) return;

        this.monthDiaryMap = new Map();
        this.monthDiaryKey = monthKey;

        const monthPrefix = `${year}${pad2(month + 1)}`;
        const stmt = `SELECT id, ial, updated FROM blocks WHERE type = 'd' AND ial LIKE '%custom-dailynote-${monthPrefix}%'`;

        try {
            const res = await fetchSyncPost("/api/query/sql", { stmt });
            if (!res || res.code !== 0) return;

            const rows = res.data || [];
            const entries = await Promise.all(
                rows.map(async (row) => {
                    const dateKey = extractDateKeyFromIAL(row.ial);
                    if (!dateKey) return null;
                    const charCount = await this.getDiaryCharCount(row.id, row.updated);
                    return {
                        dateKey,
                        id: row.id,
                        charCount,
                    };
                }),
            );

            entries.forEach((entry) => {
                if (!entry) return;
                this.monthDiaryMap.set(entry.dateKey, {
                    id: entry.id,
                    charCount: entry.charCount,
                });
            });
        } catch {
            // SQL 或导出 API 出错时，继续渲染基础日历。
        }
    }

    async getDiaryCharCount(docId, updated) {
        if (!docId) return 0;
        const cacheKey = `${docId}:${updated || ""}`;
        if (this.docWordCache.has(cacheKey)) {
            return this.docWordCache.get(cacheKey);
        }

        let charCount = 0;
        try {
            const nativeWordCount = await this.getNativeWordCount(docId);
            if (nativeWordCount !== null) {
                charCount = nativeWordCount;
            } else {
                const docInfoRes = await fetchSyncPost("/api/block/getDocInfo", { id: docId });
                const fromDocInfo = this.pickDocCharCount(docInfoRes?.data);
                if (fromDocInfo !== null) {
                    charCount = fromDocInfo;
                } else {
                    const res = await fetchSyncPost("/api/export/exportMdContent", { id: docId });
                    if (res && res.code === 0) {
                        const markdown = typeof res.data === "string"
                            ? res.data
                            : (res.data?.content || "");
                        charCount = countVisibleChars(markdown);
                    }
                }
            }
        } catch {
            // Ignore and keep 0
        }

        this.docWordCache.set(cacheKey, charCount);
        return charCount;
    }

    async getNativeWordCount(docId) {
        if (!docId) return null;
        try {
            const res = await fetchSyncPost("/api/block/getBlocksWordCount", {
                ids: [docId],
            });
            if (!res || res.code !== 0) return null;
            const data = res.data;
            const candidates = [
                data?.stat?.wordCount,
                data?.wordCount,
                data?.stat?.runeCount,
                data?.runeCount,
                data?.stat?.charCount,
                data?.charCount,
            ];
            for (const value of candidates) {
                const num = Number(value);
                if (Number.isFinite(num) && num >= 0) {
                    return num;
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    pickDocCharCount(docInfo) {
        if (!docInfo || typeof docInfo !== "object") return null;
        const candidates = [
            docInfo.wordCount,
            docInfo.stat?.wordCount,
            docInfo.runeCount,
            docInfo.charCount,
            docInfo.count,
            docInfo.stat?.charCount,
            docInfo.stat?.count,
        ];
        for (const value of candidates) {
            const num = Number(value);
            if (Number.isFinite(num) && num >= 0) {
                return num;
            }
        }
        return null;
    }

    getDiaryDotCount(diaryInfo) {
        if (!diaryInfo) return 0;
        const threshold = normalizeNumber(this.config.dotWordThreshold, DEFAULT_CONFIG.dotWordThreshold, 20, 5000);
        const charCount = Math.max(0, Number(diaryInfo.charCount) || 0);
        if (charCount <= 0) return 1;
        return clamp(Math.ceil(charCount / threshold), 1, 3);
    }

    renderDots(dotCount) {
        if (!dotCount) return "";
        return Array.from({ length: dotCount }, () => `<span class="tc-dot"></span>`).join("");
    }

    getQuarterText(month) {
        const quarter = Math.floor(month / 3);
        if (this.config.quarterLabelMode === "season") {
            return QUARTER_SEASON_LABELS[quarter] || "";
        }
        return `${quarter + 1}季度`;
    }

    async renderCalendar() {
        if (!this.calendarGrid || !this.calendarTitle || !this.calendarMonth) return;
        const year = this.currentYear;
        const month = this.currentMonth;
        const seq = ++this.renderSeq;

        this.applyFontSizing();
        this.applyAppearanceStyle();
        this.applyWeekConfig();
        this.calendarTitle.textContent = `${year}年`;
        this.calendarMonth.textContent = `${month + 1}月`;
        if (this.calendarQuarter) {
            this.calendarQuarter.textContent = this.getQuarterText(month);
        }

        await this.loadMonthDiaryMap(year, month);
        if (seq !== this.renderSeq) return;

        const firstDay = new Date(year, month, 1);
        const offset = (firstDay.getDay() - this.config.weekStart + 7) % 7;
        const startDate = new Date(year, month, 1 - offset);
        const fragment = document.createDocumentFragment();
        const today = new Date();
        const showWeekNumber = this.config.showWeekNumber !== false;

        for (let row = 0; row < 6; row += 1) {
            const rowStart = addDays(startDate, row * 7);
            if (showWeekNumber) {
                const weekCell = document.createElement("div");
                weekCell.className = "tc-weeknum";
                weekCell.textContent = String(getISOWeekNumber(rowStart));
                fragment.appendChild(weekCell);
            }

            for (let col = 0; col < 7; col += 1) {
                const date = addDays(rowStart, col);
                const dateKey = formatDateString(date);
                const isOtherMonth = date.getMonth() !== month;
                const isToday =
                    date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();
                const isSelected = dateKey === this.selectedDateKey;

                const meta = this.getDayMeta(date);
                const diaryInfo = this.monthDiaryMap.get(dateKey);
                const dotCount = this.getDiaryDotCount(diaryInfo);

                let subText = meta.lunarText;
                let subClass = "";
                if (meta.festival) {
                    subText = meta.festival;
                    subClass = " tc-sub--festival";
                } else if (meta.term) {
                    subText = meta.term;
                    subClass = " tc-sub--term";
                }

                const miniTags = [];
                if (meta.isOff) miniTags.push('<span class="tc-mini tc-mini--off">休</span>');
                if (meta.isWork) miniTags.push('<span class="tc-mini tc-mini--work">班</span>');

                const cell = document.createElement("div");
                cell.className = "tc-cell";
                if (isOtherMonth) cell.classList.add("tc-cell--muted");
                if (isToday && isSelected) cell.classList.add("tc-cell--today");
                if (isSelected) cell.classList.add("tc-cell--selected");
                if (meta.isOff || meta.festival) cell.classList.add("tc-cell--holiday");
                if (meta.isWork) cell.classList.add("tc-cell--work");
                if (diaryInfo) cell.classList.add("tc-cell--has");

                cell.dataset.date = dateKey;
                cell.innerHTML = `
                    <div class="tc-topline">
                        <div class="tc-date">${date.getDate()}</div>
                        <div class="tc-mini-wrap">${miniTags.join("")}</div>
                    </div>
                    <div class="tc-sub${subClass}">${subText || "&nbsp;"}</div>
                    <div class="tc-dots">${this.renderDots(dotCount)}</div>
                `;
                fragment.appendChild(cell);
            }
        }

        this.calendarGrid.innerHTML = "";
        this.calendarGrid.appendChild(fragment);
    }

    getSolarTerms(year) {
        if (this.solarTermCache.has(year)) return this.solarTermCache.get(year);

        const map = {};
        for (let i = 0; i < SOLAR_TERM_INFO.length; i += 1) {
            const base = Date.UTC(1900, 0, 6, 2, 5);
            const offset = 31556925974.7 * (year - 1900) + SOLAR_TERM_INFO[i] * 60000;
            const termDate = new Date(base + offset);
            const month = termDate.getUTCMonth() + 1;
            const day = termDate.getUTCDate();
            map[`${pad2(month)}-${pad2(day)}`] = SOLAR_TERM_NAMES[i];
        }
        this.solarTermCache.set(year, map);
        return map;
    }

    getLunarInfo(date) {
        if (!this.lunarFormatter) return null;
        try {
            const parts = this.lunarFormatter.formatToParts(date);
            const monthPart = parts.find((part) => part.type === "month")?.value;
            const dayPart = parts.find((part) => part.type === "day")?.value;
            if (!monthPart || !dayPart) return null;

            const isLeap = monthPart.startsWith("闰");
            const monthName = monthPart.replace("闰", "");
            const month = LUNAR_MONTH_MAP[monthName];
            const day = parseInt(dayPart, 10);
            if (!month || Number.isNaN(day)) return null;

            return { month, day, isLeap, monthLabel: monthPart };
        } catch {
            return null;
        }
    }

    getLunarHoliday(date) {
        const info = this.getLunarInfo(date);
        if (!info || info.isLeap) return null;

        const key = `${info.month}-${info.day}`;
        if (LUNAR_HOLIDAYS[key]) return LUNAR_HOLIDAYS[key];

        if (info.month === 12 && (info.day === 29 || info.day === 30)) {
            const next = addDays(date, 1);
            const nextInfo = this.getLunarInfo(next);
            if (nextInfo && nextInfo.month === 1 && nextInfo.day === 1) {
                return "除夕";
            }
        }
        return null;
    }

    getLunarDisplay(date) {
        const info = this.getLunarInfo(date);
        if (!info) return "";
        if (info.day === 1) return info.monthLabel;
        return LUNAR_DAY_TEXT[info.day] || "";
    }

    getFestivalLabel(date) {
        const solarKey = `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
        const solarHoliday = SOLAR_HOLIDAYS[solarKey];
        if (solarHoliday) return solarHoliday;
        return this.getLunarHoliday(date);
    }

    getOfficialSchedule(date) {
        if (date.getFullYear() !== 2026) {
            return { isOff: false, isWork: false };
        }
        const key = formatDateString(date);
        return {
            isOff: this.holidaySchedule.offDates.has(key),
            isWork: this.holidaySchedule.workDates.has(key),
        };
    }

    getDayMeta(date) {
        const solarKey = `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
        const solarTerms = this.getSolarTerms(date.getFullYear());
        const termLabel = solarTerms[solarKey] || "";
        const festival = this.getFestivalLabel(date);
        const lunarText = this.getLunarDisplay(date);
        const schedule = this.getOfficialSchedule(date);

        return {
            festival,
            term: termLabel,
            lunarText,
            isOff: schedule.isOff,
            isWork: schedule.isWork,
        };
    }

    async openDailyNoteByDate(dateString) {
        try {
            const parts = dateString.split("-").map((value) => Number(value));
            const date = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
            if (!parts[0] || !parts[1] || !parts[2] || Number.isNaN(date.getTime())) {
                showMessage("日期格式错误", 3000, "error");
                return;
            }

            this.selectedDateKey = formatDateString(date);
            this.renderCalendar();

            const notebookId = await this.ensureNotebookId();
            if (!notebookId) {
                showMessage("请在插件设置中选择日记本", 3000, "error");
                return;
            }

            const dailyNotePlan = await this.resolveDailyNotePath(notebookId, date);
            const existingId = await this.findDailyNoteId(date, notebookId, dailyNotePlan);
            if (existingId) {
                await this.setDailyNoteAttr(existingId, date);
                await this.markDiaryExists(date, existingId);
                this.openDoc(existingId);
                return;
            }

            const newId = await this.createDailyNote(notebookId, date, dailyNotePlan);
            if (newId) {
                await this.setDailyNoteAttr(newId, date);
                await this.markDiaryExists(date, newId);
                this.openDoc(newId);
            } else {
                showMessage("创建日记成功，但未返回文档 ID", 4000, "error");
            }
        } catch (error) {
            showMessage(`打开日记失败：${error.message || error}`, 4000, "error");
        }
    }

    async markDiaryExists(date, id) {
        const key = formatDateString(date);
        const prev = this.monthDiaryMap.get(key);
        let charCount = prev?.charCount || 0;
        if (id) {
            charCount = await this.loadDocCharCount(id, charCount);
        }
        this.monthDiaryMap.set(key, {
            id,
            charCount,
        });
        this.renderCalendar();
    }

    async loadDocCharCount(docId, fallback = 0) {
        if (!docId) return fallback;
        let updated = "";
        try {
            const safeId = String(docId).replace(/'/g, "''");
            const res = await fetchSyncPost("/api/query/sql", {
                stmt: `SELECT updated FROM blocks WHERE id = '${safeId}' LIMIT 1`,
            });
            updated = res?.data?.[0]?.updated || "";
        } catch {
            updated = "";
        }
        try {
            const count = await this.getDiaryCharCount(docId, updated);
            const num = Number(count);
            if (Number.isFinite(num) && num >= 0) return num;
        } catch {
            // Ignore and use fallback
        }
        return fallback;
    }

    async findDailyNoteId(date, notebookId = "", dailyNotePlan = null) {
        const key = formatDateKey(date);
        const stmt = `SELECT id FROM blocks WHERE type = 'd' AND ial LIKE '%custom-dailynote-${key}%' LIMIT 1`;
        const res = await fetchSyncPost("/api/query/sql", { stmt });
        if (res && res.code === 0) {
            const rows = res.data || [];
            const byAttr = rows[0]?.id || "";
            if (byAttr) return byAttr;
        }

        if (!notebookId) return "";
        const plan = dailyNotePlan || await this.resolveDailyNotePath(notebookId, date);
        if (!plan?.path) return "";

        const byPathRes = await fetchSyncPost("/api/filetree/getIDsByHPath", {
            notebook: notebookId,
            path: plan.path,
        });
        if (!byPathRes || byPathRes.code !== 0) return "";
        const ids = Array.isArray(byPathRes.data) ? byPathRes.data : [];
        return ids[0] || "";
    }

    async ensureNotebookId() {
        if (this.config.notebookId) return this.config.notebookId;
        const notebooks = await this.loadNotebooks();
        if (!notebooks.length) return "";
        this.config.notebookId = notebooks[0].id;
        await this.saveConfig();
        if (this.notebookSelect) this.notebookSelect.value = this.config.notebookId;
        return this.config.notebookId;
    }

    async resolveDailyNotePath(notebookId, date) {
        let pathTemplate = DEFAULT_DAILY_NOTE_PATH;
        let dailyNoteTemplatePath = "";
        const confRes = await fetchSyncPost("/api/notebook/getNotebookConf", { notebook: notebookId });
        if (confRes && confRes.code === 0) {
            const conf = confRes.data?.conf || confRes.data;
            if (conf?.dailyNoteSavePath) pathTemplate = conf.dailyNoteSavePath;
            if (conf?.dailyNoteTemplatePath) dailyNoteTemplatePath = conf.dailyNoteTemplatePath;
        }

        let path = await this.renderDailyPathWithSprig(pathTemplate, date);
        if (!path) {
            path = renderDailyNotePath(pathTemplate, date);
        }
        if (path.includes("{{")) {
            path = `/daily note/${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${formatDateString(date)}`;
        }
        return {
            path,
            templatePath: dailyNoteTemplatePath,
        };
    }

    async renderDailyPathWithSprig(pathTemplate, date) {
        const template = String(pathTemplate || "").trim();
        if (!template) return "";

        const dateString = formatDateString(date);
        const dateExpr = `toDate "2006-01-02" "${dateString}"`;
        const sprigTemplate = template.replace(/\bnow\b/g, dateExpr);
        try {
            const res = await fetchSyncPost("/api/template/renderSprig", {
                template: sprigTemplate,
            });
            if (!res || res.code !== 0) return "";
            const rendered = typeof res.data === "string"
                ? res.data
                : (res.data?.template || "");
            return String(rendered || "").trim();
        } catch {
            return "";
        }
    }

    async createDailyNote(notebookId, date, dailyNotePlan) {
        const dateKey = formatDateKey(date);
        const todayKey = formatDateKey(new Date());

        if (dateKey === todayKey) {
            try {
                const createRes = await fetchSyncPost("/api/filetree/createDailyNote", {
                    notebook: notebookId,
                    app: this.app?.appId,
                });
                if (createRes && createRes.code === 0) {
                    return createRes.data?.id || createRes.data || "";
                }
            } catch {
                // Fallback to createDocWithMd below.
            }
        }

        const existingRes = await fetchSyncPost("/api/filetree/getIDsByHPath", {
            notebook: notebookId,
            path: dailyNotePlan.path,
        });
        if (existingRes && existingRes.code === 0) {
            const ids = Array.isArray(existingRes.data) ? existingRes.data : [];
            if (ids[0]) return ids[0];
        }

        const createRes = await fetchSyncPost("/api/filetree/createDocWithMd", {
            notebook: notebookId,
            path: dailyNotePlan.path,
            markdown: "",
        });
        if (!createRes || createRes.code !== 0) {
            throw new Error(createRes?.msg || "创建日记失败");
        }

        const newId = createRes.data?.id || createRes.data || "";
        if (newId) {
            await this.applyDailyNoteTemplate(newId, dailyNotePlan.templatePath);
        }
        return newId;
    }

    async applyDailyNoteTemplate(docId, templatePath) {
        const renderPath = this.resolveTemplateRenderPath(templatePath);
        if (!renderPath) return;

        try {
            const renderRes = await fetchSyncPost("/api/template/render", {
                id: docId,
                path: renderPath,
                preview: false,
            });
            if (!renderRes || renderRes.code !== 0) return;

            const content =
                renderRes.data?.content ||
                renderRes.data?.template ||
                (typeof renderRes.data === "string" ? renderRes.data : "");
            if (!content) return;

            await fetchSyncPost("/api/block/appendBlock", {
                dataType: "dom",
                data: content,
                parentID: docId,
            });
        } catch {
            // Template rendering is optional; keep created doc even if it fails.
        }
    }

    resolveTemplateRenderPath(templatePath) {
        const rawTemplatePath = String(templatePath || "").trim();
        if (!rawTemplatePath) return "";

        const normalized = rawTemplatePath.replace(/\\/g, "/");
        const dataDir = String(window?.siyuan?.config?.system?.dataDir || "").replace(/\\/g, "/");
        const isWindowsAbsPath = /^[A-Za-z]:[\\/]/.test(rawTemplatePath);
        const isUNCPath = /^\\\\/.test(rawTemplatePath);
        if (isWindowsAbsPath || isUNCPath) {
            return rawTemplatePath;
        }

        if (normalized.startsWith("/data/templates/")) {
            if (dataDir) {
                const templateSubPath = normalized.slice("/data/templates/".length);
                return joinPathSegments(dataDir, "templates", templateSubPath);
            }
            return normalized;
        }

        if (normalized.startsWith("/templates/")) {
            const templateSubPath = normalized.slice("/templates/".length);
            if (dataDir) {
                return joinPathSegments(dataDir, "templates", templateSubPath);
            }
            return `/data/templates/${templateSubPath}`;
        }

        const templateSubPath = normalized.replace(/^\/+/, "");
        if (dataDir) {
            return joinPathSegments(dataDir, "templates", templateSubPath);
        }
        return `/data/templates/${templateSubPath}`;
    }

    async setDailyNoteAttr(blockId, date) {
        const key = formatDateKey(date);
        await fetchSyncPost("/api/attr/setBlockAttrs", {
            id: blockId,
            attrs: {
                [`custom-dailynote-${key}`]: "true",
            },
        });
    }

    openDoc(id) {
        if (this.isMobile && typeof openMobileFileById === "function") {
            openMobileFileById(this.app, id);
            return;
        }
        if (typeof openTab === "function") {
            openTab({
                app: this.app,
                doc: { id },
                openNewTab: true,
            });
            return;
        }
        showMessage("当前版本不支持打开文档 API", 3000, "error");
    }
};


