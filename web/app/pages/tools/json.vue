<template>
  <div class="doc-page-gradient text-slate-900">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <nav class="text-sm text-slate-500 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="面包屑">
        <NuxtLink to="/" class="hover:text-blue-600 transition-colors">首页</NuxtLink>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <span class="text-slate-600">工具</span>
        <span class="text-slate-300" aria-hidden="true">/</span>
        <span class="text-slate-900 font-medium">JSON 格式化</span>
      </nav>

      <header class="mb-6 pb-6 border-b border-slate-200/80">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            class="w-12 h-12 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm border border-blue-100"
          >
            <van-icon name="description" size="24" class="text-blue-600" />
          </div>
          <div>
            <h1 class="font-display text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              JSON 格式化
            </h1>
            <p class="mt-2 doc-prose-muted text-base max-w-3xl">
              双栏编辑、实时校验与自动美化，文本 / 树 / 表格 / 类型多视图；本地历史（IndexedDB）；缩进与
              <a
                href="https://json.site/cn"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:text-blue-700 underline underline-offset-2"
              >JSON.site</a>
              等产品类似能力。数据仅在浏览器内处理。
            </p>
          </div>
        </div>
      </header>

      <!-- 选项栏 -->
      <div
        class="flex flex-wrap items-center gap-3 sm:gap-4 mb-5 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white/90 shadow-sm"
      >
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <span class="text-slate-500 shrink-0">缩进</span>
          <select
            v-model="indentMode"
            class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="1">1 空格</option>
            <option value="2">2 空格</option>
            <option value="3">3 空格</option>
            <option value="4">4 空格</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            v-model="sortKeys"
            type="checkbox"
            class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          键名排序
        </label>
      </div>

      <!-- 工具栏：白底提示 + 圆形悬停（与格式化按钮一致，避免黑底主色钮） -->
      <div
        class="relative z-30 mt-1 flex flex-wrap items-center gap-0.5 mb-3 rounded-xl border border-slate-200/85 bg-slate-50/90 px-1.5 py-1 shadow-sm"
      >
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="格式化"
          aria-label="格式化"
          @click="formatJson"
        >
          <!-- 左对齐三横线，中间较短（与常见「格式化」图示一致） -->
          <svg
            class="size-[18px] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M5 7h14M5 12h8.5M5 17h14" />
          </svg>
        </button>
        <span class="mx-0.5 w-px h-5 shrink-0 self-center bg-slate-200/90" aria-hidden="true" />
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="压缩 JSON 并复制"
          aria-label="压缩 JSON 并复制到剪贴板"
          @click="compressJsonAndCopy"
        >
          <!-- 上：向下箭；中：双横线；下：向上箭（与常见「压缩」图示一致，勿把长横线画在最外） -->
          <svg
            class="size-[18px] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5.25 12 7.75M9.25 6.5 12 8.75 14.75 6.5" />
            <path d="M5 10.5h14M5 13h14" />
            <path d="M12 18.75 12 16.25M9.25 17.5 12 15.25 14.75 17.5" />
          </svg>
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="复制结果"
          aria-label="复制结果"
          @click="copyOutput"
        >
          <van-icon name="description" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="复制输入"
          aria-label="复制输入"
          @click="copyInput"
        >
          <van-icon name="notes-o" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="交换左右"
          aria-label="交换左右"
          @click="swapPanels"
        >
          <van-icon name="exchange" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDefault"
          data-tip="导入文件"
          aria-label="导入文件"
          @click="triggerImport"
        >
          <van-icon name="upgrade" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="[jsonTbarBtnDefault, jsonTbarBtnDisabled]"
          data-tip="下载 JSON"
          aria-label="下载 JSON"
          :disabled="!outputJson"
          @click="downloadOutput"
        >
          <van-icon name="down" size="18" />
        </button>
        <button
          type="button"
          class="json-tbar-tip"
          :class="jsonTbarBtnDanger"
          data-tip="清空"
          aria-label="清空"
          @click="clearAll"
        >
          <van-icon name="delete-o" size="18" />
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,application/json,text/json"
          class="hidden"
          @change="onFileSelected"
        />
      </div>

      <div class="doc-surface overflow-hidden rounded-2xl border border-slate-200">
        <!-- 对比模式：双栏同步滚动 + 行/字符级高亮 + 差异跳转 -->
        <div
          v-if="outputTab === 'compare'"
          class="flex flex-col min-h-0 min-w-0 max-h-[min(88vh,720px)]"
        >
          <div
            class="shrink-0 px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-x-3 gap-y-2"
          >
            <div class="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 p-0.5 bg-white">
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                :class="outputTab === 'text' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                @click="outputTab = 'text'"
              >
                文本
              </button>
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                :class="outputTab === 'tree' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                @click="outputTab = 'tree'"
              >
                树形
              </button>
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                :class="outputTab === 'grid' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                @click="outputTab = 'grid'"
              >
                表格
              </button>
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                :class="outputTab === 'types' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                @click="outputTab = 'types'"
              >
                类型
              </button>
              <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                :class="outputTab === 'compare' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                @click="outputTab = 'compare'"
              >
                对比
              </button>
            </div>
            <span
              v-if="lineDiffMismatchCount > 0"
              class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-950 tabular-nums"
            >{{ lineDiffMismatchCount }} 处差异</span>
            <span
              v-else-if="lineDiffViewRows.length > 0"
              class="text-[11px] font-medium text-emerald-700"
            >文本一致</span>
            <div v-if="lineDiffMismatchCount > 0" class="flex items-center gap-1">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 shadow-sm outline-none hover:bg-slate-50 disabled:opacity-40"
                aria-label="上一处差异"
                :disabled="lineDiffNavIndex <= 0"
                @click="jumpLineDiff(-1)"
              >
                <span class="text-base leading-none" aria-hidden="true">‹</span>
              </button>
              <span class="tabular-nums text-[11px] text-slate-600">{{ lineDiffNavIndex + 1 }} / {{ lineDiffMismatchCount }}</span>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 shadow-sm outline-none hover:bg-slate-50 disabled:opacity-40"
                aria-label="下一处差异"
                :disabled="lineDiffNavIndex >= lineDiffMismatchCount - 1"
                @click="jumpLineDiff(1)"
              >
                <span class="text-base leading-none" aria-hidden="true">›</span>
              </button>
            </div>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              title="优先使用当前 A 侧全文（与「输入」一致，可保留 1600.00 等写法）；仅当 A 为空时使用右侧「文本」里的格式化结果。"
              @click="fillCompareFromOutput"
            >
              将左侧填入 B
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              @click="swapCompareAB"
            >
              交换 A / B
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              @click="clearCompareB"
            >
              清空 B
            </button>
          </div>
          <p
            v-if="compareError"
            class="shrink-0 px-3 py-2 text-xs text-red-600 font-mono border-b border-slate-100 break-words [overflow-wrap:anywhere]"
          >
            {{ compareError }}
          </p>
          <p
            v-if="lineDiffViewCapped"
            class="shrink-0 px-3 py-1.5 text-[11px] text-amber-900 bg-amber-50/90 border-b border-amber-100"
          >
            文本对比已超过 {{ lineDiffMaxRows }} 行，仅显示前 {{ lineDiffMaxRows }} 行；可缩小 JSON 后再试。
          </p>
          <p
            v-if="lineDiffViewRows.length > 0"
            class="shrink-0 px-3 py-1 text-[10px] leading-snug text-slate-500 border-b border-slate-100 bg-slate-50/60"
          >
            侧栏为各侧实际源行号；「·」仅表示对齐占位，另一边的字符串不会因此被插入换行。
          </p>
          <div class="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div class="flex min-h-0 flex-col bg-[var(--doc-code-bg)] min-h-[min(52vh,480px)] lg:min-h-0">
              <div
                class="shrink-0 px-2 py-1.5 text-[11px] font-medium text-slate-600 border-b border-slate-200 bg-slate-100/90 flex flex-wrap items-center justify-between gap-2"
              >
                <span>A · 编辑与高亮合一（有内容时字透明，仅看底色与字符标记）</span>
                <span class="text-slate-400 tabular-nums">{{ lineDiffLeftSourceLineCount }} 行</span>
              </div>
              <div class="flex min-h-[min(48vh,440px)] flex-1 min-h-0">
                <div
                  ref="lineDiffLeftGutterRef"
                  class="w-9 shrink-0 overflow-y-hidden py-3 pl-1 pr-0.5 text-right text-[11px] font-mono text-slate-400 bg-slate-100/80 border-r border-slate-200 select-none"
                  aria-hidden="true"
                >
                  <div
                    v-for="(row, i) in lineDiffViewRows"
                    :key="'lg' + i"
                    class="h-6 leading-6 tabular-nums"
                    :class="row.leftLineNo === null ? 'text-slate-300' : ''"
                    :title="
                      row.leftLineNo === null
                        ? '对齐占位：左侧无对应源行'
                        : undefined
                    "
                  >
                    {{ row.leftLineNo ?? '·' }}
                  </div>
                </div>
                <div
                  ref="lineDiffLeftMarkRef"
                  class="w-5 shrink-0 overflow-y-hidden py-3 text-center text-[11px] font-mono text-slate-500 bg-slate-100/60 border-r border-slate-200 select-none"
                  aria-hidden="true"
                >
                  <div
                    v-for="(row, i) in lineDiffViewRows"
                    :key="'lmark' + i"
                    class="h-6 leading-6"
                  >
                    {{ row.markLeft }}
                  </div>
                </div>
                <div class="relative min-h-0 flex-1 min-w-0">
                  <div
                    ref="lineDiffLeftMirrorRef"
                    class="json-compare-ld-mirror pointer-events-none absolute inset-0 overflow-hidden py-3 pl-2 pr-2 font-mono text-sm text-slate-800 leading-6"
                    :style="{ tabSize: inputTabSize }"
                  >
                    <div
                      v-for="(row, i) in lineDiffViewRows"
                      :id="'json-line-diff-L-' + i"
                      :key="'lc' + i"
                      class="min-h-6 whitespace-pre overflow-x-auto"
                      :class="[lineDiffRowBgClass(row.kind).left, lineDiffRowFocusClass(i)]"
                    >
                      <span v-html="row.leftHtml" />
                    </div>
                  </div>
                  <textarea
                    ref="lineDiffLeftTaRef"
                    v-model="compareTextA"
                    spellcheck="false"
                    class="relative z-10 box-border h-full min-h-[min(48vh,440px)] w-full resize-none overflow-y-auto overflow-x-auto whitespace-pre bg-transparent py-3 pl-2 pr-2 font-mono text-sm leading-6 border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 selection:bg-blue-200/45"
                    :style="{ tabSize: inputTabSize }"
                    :class="compareTextA.length > 0 ? 'text-transparent caret-slate-800' : 'text-slate-800'"
                    placeholder="JSON A…"
                    wrap="off"
                    @scroll="onCompareLeftPaneScroll"
                  />
                </div>
              </div>
            </div>
            <div class="flex min-h-0 flex-col bg-white min-h-[min(52vh,480px)] lg:min-h-0">
              <div
                class="shrink-0 px-2 py-1.5 text-[11px] font-medium text-slate-600 border-b border-slate-200 bg-slate-100/90 flex flex-wrap items-center justify-between gap-2"
              >
                <span>B · 编辑与高亮合一</span>
                <span class="text-slate-400 tabular-nums">{{ lineDiffRightSourceLineCount }} 行</span>
              </div>
              <div class="flex min-h-[min(48vh,440px)] flex-1 min-h-0">
                <div
                  ref="lineDiffRightGutterRef"
                  class="w-9 shrink-0 overflow-y-hidden py-3 pl-1 pr-0.5 text-right text-[11px] font-mono text-slate-400 bg-slate-50 border-r border-slate-200 select-none"
                  aria-hidden="true"
                >
                  <div
                    v-for="(row, i) in lineDiffViewRows"
                    :key="'rg' + i"
                    class="h-6 leading-6 tabular-nums"
                    :class="row.rightLineNo === null ? 'text-slate-300' : ''"
                    :title="
                      row.rightLineNo === null
                        ? '对齐占位：右侧无对应源行（未向 B 插入换行）'
                        : undefined
                    "
                  >
                    {{ row.rightLineNo ?? '·' }}
                  </div>
                </div>
                <div
                  ref="lineDiffRightMarkRef"
                  class="w-5 shrink-0 overflow-y-hidden py-3 text-center text-[11px] font-mono text-slate-500 bg-slate-50/80 border-r border-slate-200 select-none"
                  aria-hidden="true"
                >
                  <div
                    v-for="(row, i) in lineDiffViewRows"
                    :key="'rmark' + i"
                    class="h-6 leading-6"
                  >
                    {{ row.markRight }}
                  </div>
                </div>
                <div class="relative min-h-0 flex-1 min-w-0">
                  <div
                    ref="lineDiffRightMirrorRef"
                    class="json-compare-ld-mirror pointer-events-none absolute inset-0 overflow-hidden py-3 pl-2 pr-2 font-mono text-sm text-slate-800 leading-6"
                    :style="{ tabSize: inputTabSize }"
                  >
                    <div
                      v-for="(row, i) in lineDiffViewRows"
                      :id="'json-line-diff-R-' + i"
                      :key="'rc' + i"
                      class="min-h-6 whitespace-pre overflow-x-auto"
                      :class="[lineDiffRowBgClass(row.kind).right, lineDiffRowFocusClass(i)]"
                    >
                      <span v-html="row.rightHtml" />
                    </div>
                  </div>
                  <textarea
                    ref="lineDiffRightTaRef"
                    v-model="compareTextB"
                    spellcheck="false"
                    class="relative z-10 box-border h-full min-h-[min(48vh,440px)] w-full resize-none overflow-y-auto overflow-x-auto whitespace-pre bg-transparent py-3 pl-2 pr-2 font-mono text-sm leading-6 border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 selection:bg-blue-200/45"
                    :style="{ tabSize: inputTabSize }"
                    :class="compareTextB.length > 0 ? 'text-transparent caret-slate-800' : 'text-slate-800'"
                    placeholder="JSON B…"
                    wrap="off"
                    @scroll="onCompareRightPaneScroll"
                  />
                </div>
              </div>
            </div>
          </div>
          <details
            v-if="lastParsed !== null && compareParsed !== null && compareStructuralVisual && !compareError"
            class="shrink-0 border-t border-slate-200 bg-slate-50/80 px-3 py-2"
          >
            <summary class="cursor-pointer text-xs font-medium text-slate-700 select-none">
              路径级对比（表格）
            </summary>
            <div class="mt-2 max-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div
                class="grid shrink-0 border-b border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-600"
                style="grid-template-columns: 2rem minmax(6rem, 9rem) minmax(0, 1fr) minmax(0, 1fr)"
              >
                <div class="border-r border-slate-200 px-0.5 py-1 text-center text-[10px] font-normal text-slate-500">标</div>
                <div class="border-r border-slate-200 px-1.5 py-1">路径</div>
                <div class="border-r border-slate-200 px-1.5 py-1">A 值</div>
                <div class="px-1.5 py-1">B 值</div>
              </div>
              <div class="max-h-52 overflow-auto">
                <div
                  v-for="(row, idx) in compareStructuralVisual.rows"
                  :key="'st' + idx"
                  class="grid min-h-[1.5rem] text-[11px] font-mono leading-5 border-b border-slate-100"
                  style="grid-template-columns: 2rem minmax(6rem, 9rem) minmax(0, 1fr) minmax(0, 1fr)"
                  :class="compareRowStripeOnly(row)"
                >
                  <div class="flex items-start justify-center border-r border-slate-200/80 bg-slate-100/85 py-0.5 font-bold text-[10px]">
                    <span :class="compareGutterTextClass(row)" :title="compareGutterTitle(row)">{{ row.gutter }}</span>
                  </div>
                  <div
                    class="min-w-0 break-all border-r border-slate-200/80 px-1.5 py-0.5 text-slate-700 bg-slate-50/70 [overflow-wrap:anywhere]"
                    :title="row.path"
                  >{{ row.path }}</div>
                  <div
                    class="min-w-0 border-r border-slate-200/80 px-1.5 py-0.5 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                    :class="compareValueCellClass(row, 'left')"
                  >{{ row.left }}</div>
                  <div
                    class="min-w-0 px-1.5 py-0.5 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                    :class="compareValueCellClass(row, 'right')"
                  >{{ row.right }}</div>
                </div>
              </div>
            </div>
          </details>
        </div>

        <!-- 2×2 网格：首行左右工具栏同一行高，次行编辑器顶对齐 -->
        <div
          v-else
          class="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(320px,min(70vh,560px))_auto_minmax(320px,min(70vh,560px))] gap-0 divide-y divide-slate-200 lg:grid-cols-2 lg:grid-rows-[auto_minmax(320px,min(70vh,560px))] lg:divide-y-0"
        >
          <div
            class="box-border flex min-h-0 min-w-0 flex-col bg-slate-50 border-b border-slate-200 lg:col-start-1 lg:row-start-1"
          >
            <div class="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">输入</span>
                <div ref="historyPanelRef" class="relative">
                  <button
                    type="button"
                    class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    :aria-expanded="historyPanelOpen"
                    aria-haspopup="listbox"
                    @click.stop="toggleHistoryPanel"
                  >
                    历史
                  </button>
                  <div
                    v-show="historyPanelOpen"
                    class="absolute left-0 top-[calc(100%+4px)] z-40 w-[min(calc(100vw-2rem),18rem)] max-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                    role="listbox"
                  >
                    <div class="max-h-52 overflow-y-auto">
                      <p
                        v-if="historyItems.length === 0"
                        class="px-3 py-4 text-center text-xs text-slate-500"
                      >
                        暂无记录；成功解析后会自动保存到本机。
                      </p>
                      <button
                        v-for="h in historyItems"
                        :key="h.id"
                        type="button"
                        class="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-slate-50"
                        @click="loadHistoryEntry(h)"
                      >
                        <span class="line-clamp-2 flex-1 font-mono text-slate-800">{{ h.preview }}</span>
                        <span class="shrink-0 tabular-nums text-slate-400">{{ formatHistoryTime(h.createdAt) }}</span>
                      </button>
                    </div>
                    <div
                      v-if="historyItems.length > 0"
                      class="flex justify-end border-t border-slate-100 bg-slate-50 px-2 py-1.5"
                    >
                      <button
                        type="button"
                        class="text-xs text-red-600 hover:text-red-700"
                        @click="onClearHistory"
                      >
                        清空历史
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <span class="text-xs text-slate-400 tabular-nums">{{ inputLineCount }} 行</span>
            </div>
          </div>

          <div
            class="box-border flex min-h-0 h-full min-w-0 overflow-hidden bg-[var(--doc-code-bg)] border-b border-slate-200 lg:col-start-1 lg:row-start-2 lg:border-b-0"
          >
              <div
                class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                :class="error ? 'pr-11' : ''"
              >
                <!-- 解析错误：输入区右上角图标，点击展开/收起说明 -->
                <div
                  v-if="error"
                  ref="errorPopoverRef"
                  class="absolute top-2 right-2 z-20 flex flex-col items-end gap-0"
                >
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-200/90 bg-red-50/95 text-red-600 shadow-sm backdrop-blur-[2px] outline-none transition hover:border-red-300 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-2"
                    aria-controls="json-parse-error-tooltip"
                    :aria-expanded="errorTooltipOpen"
                    aria-label="JSON 解析错误：单击查看详情，再次单击或点击输入区外关闭"
                    @click.stop="toggleErrorTooltip"
                  >
                    <van-icon name="warning-o" size="18" />
                  </button>
                  <div
                    v-show="errorTooltipOpen"
                    id="json-parse-error-tooltip"
                    role="tooltip"
                    class="mt-1.5 w-max max-w-[min(calc(100vw-3rem),22rem)] shadow-lg sm:max-w-[min(100vw-4rem,36rem)]"
                    @click.stop
                  >
                    <div
                      class="rounded-lg border border-red-200/90 bg-white px-3 py-2.5 text-left text-xs font-mono leading-relaxed text-red-900 shadow-md max-h-52 overflow-y-auto break-words [overflow-wrap:anywhere]"
                    >
                      {{ error }}
                    </div>
                  </div>
                </div>
                <ClientOnly>
                  <JsonCodeMirrorPane
                    v-model="inputJson"
                    class="min-h-0 flex-1"
                    :tab-size="inputTabSize"
                    :single-indent="editorSingleIndent"
                    :error-char-index="error && errorIndexInRaw != null ? errorIndexInRaw : null"
                    :error-message="error"
                    placeholder="在此粘贴或输入 JSON…"
                  />
                </ClientOnly>
              </div>
            </div>

          <!-- 输出：工具栏与正文分两格，与左侧同一 2×2 网格，首行同高以便编辑器顶对齐 -->
          <div
            class="box-border flex min-h-0 min-w-0 flex-col bg-slate-50 border-b border-slate-200 lg:col-start-2 lg:row-start-1 lg:border-l lg:border-slate-200"
          >
            <div class="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 p-0.5 bg-white">
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="outputTab === 'text' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                  @click="outputTab = 'text'"
                >
                  文本
                </button>
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="outputTab === 'tree' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                  @click="outputTab = 'tree'"
                >
                  树形
                </button>
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="outputTab === 'grid' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                  @click="outputTab = 'grid'"
                >
                  表格
                </button>
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="outputTab === 'types' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                  @click="outputTab = 'types'"
                >
                  类型
                </button>
                <button
                  type="button"
                  class="px-2 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="outputTab === 'compare' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'"
                  @click="outputTab = 'compare'"
                >
                  对比
                </button>
              </div>
              <span v-if="!error && outputJson" class="text-xs text-green-600 font-medium shrink-0">已解析</span>
              <span v-else-if="!outputJson && !error" class="text-xs text-slate-400 shrink-0">等待输入</span>
            </div>
          </div>

          <div
            class="box-border flex min-h-0 h-full min-w-0 flex-col overflow-hidden bg-white lg:col-start-2 lg:row-start-2 lg:border-l lg:border-slate-200"
          >
            <div class="flex min-h-0 h-full flex-1 overflow-hidden">
              <div
                v-if="outputTab === 'text'"
                class="flex min-h-0 h-full min-w-0 flex-1 overflow-hidden"
              >
                <ClientOnly>
                  <JsonCodeMirrorPane
                    v-model="outputJson"
                    class="min-h-0 flex-1"
                    read-only
                    tone="output"
                    :tab-size="inputTabSize"
                    :single-indent="editorSingleIndent"
                    placeholder="格式化或压缩后的结果将显示在这里"
                  />
                </ClientOnly>
              </div>
              <div
                v-else-if="outputTab === 'tree'"
                class="min-h-0 flex-1 overflow-auto p-4 bg-slate-50/50"
              >
                <JsonTreeView v-if="lastParsed !== null" :data="lastParsed" />
                <p v-else class="text-sm text-slate-500">解析成功后即可查看树形结构。</p>
              </div>
              <div
                v-else-if="outputTab === 'grid'"
                class="min-h-0 flex-1 overflow-auto p-3 bg-slate-50/50"
              >
                <JsonTableView v-if="lastParsed !== null" :data="lastParsed" />
                <p v-else class="text-sm text-slate-500">解析成功后查看表格；对象数组优先展开为行列，否则为路径-值表。</p>
              </div>
              <div
                v-else-if="outputTab === 'types'"
                class="min-h-0 flex-1 overflow-auto p-4 bg-slate-50/50"
              >
                <JsonTypeView v-if="lastParsed !== null" :data="lastParsed" />
                <p v-else class="text-sm text-slate-500">解析成功后查看各路径的类型推断。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="mt-8 rounded-xl border border-blue-100 bg-blue-50/80 p-5 md:p-6">
        <h2 class="font-display text-base font-semibold text-blue-800 mb-3">使用说明</h2>
        <ul class="text-sm text-blue-700/90 space-y-2 list-disc pl-5 marker:text-blue-400">
          <li>输入内容会在短暂停顿后自动校验并美化到右侧；「格式化」可立即刷新。缩进支持 1～4 空格与 Tab。勾选「键名排序」将递归排序对象键（数组元素顺序不变）。主界面「输入 / 文本」为 CodeMirror 编辑器，支持<strong class="font-medium text-blue-900">代码折叠</strong>（行号旁 ∨ 收起对象/数组）；「对比」仍为行对齐差异视图，暂不提供折叠以免错位。</li>
          <li>「历史」将最近成功解析的原文存入本机 IndexedDB（最多约 50 条），不上传服务器。</li>
          <li>「对比」为**双栏合一编辑区**：每侧在**同一区域**内编辑（透明字 + 行底色与字符标记），左右同步滚动，**‹ ›** 跳转差异；**A 与「输入」原文一致**（不会把数字收成规范形式，例如可保留小数位写法），**B** 为解析后再格式化的文本；进入对比或刷新时会从当前模型同步两侧草稿。路径级表格在底部「路径级对比」中展开。</li>
          <li>右侧除文本、树形外，提供「表格」（同质对象数组展开为列，否则为路径-值表）与「类型」（路径与类型推断，大文件会截断）。</li>
          <li>「压缩」输出单行 minify；树/表/类型均按当前解析结果更新。支持 UTF-8 BOM；解析失败时输入区波浪线标位置，右上角图标点击查看详情。</li>
          <li>「交换左右」、导入/下载与本地文件协作方式不变。</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, computed, shallowRef, watch } from 'vue'
import { showToast } from 'vant'
import {
  parseJson,
  sortKeysDeep,
  getIndent,
  lineCountFor,
  sliceForJsonParse,
  type IndentMode
} from '~/utils/jsonTool'
import {
  extractSourceKeyOrders,
  stringifyCompactWithSourceOrder,
  stringifyPrettyWithSourceOrder
} from '~/utils/jsonPrettyOrdered'
import {
  structuralDiffRows,
  STRUCTURAL_DIFF_MAX_ROWS,
  isStructuralMismatchRow,
  type StructuralDiffRow
} from '~/utils/jsonStructuralCompare'
import {
  buildLineDiffViewRows,
  LINE_DIFF_MAX_ROWS,
  lineDiffRowBg,
  type LineDiffKind
} from '~/utils/jsonLineDiffView'

definePageMeta({
  layout: false
})

useHead({
  title: 'JSON 格式化 - Nexus Tools'
})

const jsonTbarBtnCore =
  'relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border-0 outline-none transition-[background-color,opacity,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-offset-2'
const jsonTbarBtnDefault = `${jsonTbarBtnCore} bg-transparent text-slate-600 hover:bg-black/[0.055] active:bg-black/[0.08] focus-visible:ring-slate-300/60`
const jsonTbarBtnDanger = `${jsonTbarBtnCore} bg-transparent text-red-600 hover:bg-red-500/[0.08] active:bg-red-500/[0.12] focus-visible:ring-red-300/50`
const jsonTbarBtnDisabled = 'disabled:opacity-40 disabled:pointer-events-none'

const { consumeJsonPrefill } = useJsonPrefill()
const jsonPrefillState = useState<string | null>('tool-json-prefill')

const inputJson = ref('')
const outputJson = ref('')
const error = ref('')
/** 在原始输入中的出错字符下标；仅当引擎返回 position/行列 时有值 */
const errorIndexInRaw = ref<number | null>(null)
/** 仅点击警告图标时展开；点图标或页面其它区域关闭 */
const errorTooltipOpen = ref(false)

function toggleErrorTooltip() {
  errorTooltipOpen.value = !errorTooltipOpen.value
}

watch(error, (msg) => {
  if (!msg) errorTooltipOpen.value = false
})

const errorPopoverRef = ref<HTMLElement | null>(null)
const historyPanelRef = ref<HTMLElement | null>(null)
const jsonHist = useJsonLocalHistory()
const historyItems = jsonHist.items
const historyPanelOpen = jsonHist.panelOpen

function onDocumentClickCloseErrorPopover(e: MouseEvent) {
  const t = e.target as Node
  if (errorTooltipOpen.value && error.value) {
    const root = errorPopoverRef.value
    if (root && !root.contains(t)) errorTooltipOpen.value = false
  }
  if (historyPanelOpen.value) {
    const hp = historyPanelRef.value
    if (hp && !hp.contains(t)) historyPanelOpen.value = false
  }
}

const indentMode = ref<IndentMode>('2')
const sortKeys = ref(false)
const outputTab = ref<'text' | 'tree' | 'grid' | 'types' | 'compare'>('text')
const lastParsed = shallowRef<unknown | null>(null)

const compareJson = ref('')
const compareError = ref('')
const compareParsed = shallowRef<unknown | null>(null)
const structuralDiffMaxRows = STRUCTURAL_DIFF_MAX_ROWS

/** 按路径全量展开：一致行标 =，便于对照定位 */
const compareStructuralVisual = computed(() => {
  if (lastParsed.value === null || compareParsed.value === null || compareError.value) return null
  return structuralDiffRows(lastParsed.value, compareParsed.value)
})

const compareStructuralMismatchCount = computed(() => {
  return compareStructuralVisual.value?.rows.filter(isStructuralMismatchRow).length ?? 0
})

function compareValueCellClass(row: StructuralDiffRow, side: 'left' | 'right'): string {
  if (row.mismatch === 'equal') return 'bg-slate-50/55 text-slate-800'
  const L = row.left
  const R = row.right
  const hasL = L.length > 0
  const hasR = R.length > 0
  if (side === 'left') {
    if (!hasL) return 'bg-slate-100/50'
    if (hasR && L !== R) return 'bg-amber-100/95'
    return 'bg-rose-100/95'
  }
  if (!hasR) return 'bg-slate-100/50'
  if (hasL && L !== R) return 'bg-amber-100/95'
  return 'bg-emerald-100/95'
}

function stringifyPrettyForCompareB(v: unknown): string {
  if (sortKeys.value) {
    return JSON.stringify(v, null, getIndent(indentMode.value))
  }
  const { slice } = sliceForJsonParse(compareJson.value)
  const orders = slice ? extractSourceKeyOrders(slice) : null
  if (!orders) {
    return JSON.stringify(v, null, getIndent(indentMode.value))
  }
  return stringifyPrettyWithSourceOrder(v, orders, indentMode.value)
}

const comparePrettyDisplay = computed(() => {
  if (compareParsed.value === null || compareError.value) return compareJson.value
  try {
    return stringifyPrettyForCompareB(compareParsed.value)
  } catch {
    return compareJson.value
  }
})

/** 并排文本对比：A 始终用「输入」原文，避免 JSON 数字经 parse/stringify 后丢失 1600.00 等写法 */
const lineDiffLeftSource = computed(() => inputJson.value)

const lineDiffRightSource = computed(() => comparePrettyDisplay.value)

/** 对比页内编辑的 A/B 文本（与下方高亮行一一对应，并同步到 inputJson / compareJson） */
const compareTextA = ref('')
const compareTextB = ref('')
let compareDraftSync = false

function refreshCompareDraftsFromModel() {
  if (outputTab.value !== 'compare') return
  compareDraftSync = true
  const la = lineDiffLeftSource.value
  const lb = lineDiffRightSource.value
  compareTextA.value = la
  compareTextB.value = lb
  inputJson.value = la
  compareJson.value = lb
  void nextTick(() => {
    compareDraftSync = false
  })
}

const lineDiffVisualBundle = computed(() => {
  if (outputTab.value !== 'compare') return { rows: [], capped: false }
  return buildLineDiffViewRows(compareTextA.value, compareTextB.value)
})

const lineDiffViewRows = computed(() => lineDiffVisualBundle.value.rows)
const lineDiffViewCapped = computed(() => lineDiffVisualBundle.value.capped)
const lineDiffMaxRows = LINE_DIFF_MAX_ROWS

const lineDiffLeftSourceLineCount = computed(() => lineCountFor(compareTextA.value))
const lineDiffRightSourceLineCount = computed(() => lineCountFor(compareTextB.value))

const lineDiffChangeIndexes = computed(() => {
  const ix: number[] = []
  lineDiffViewRows.value.forEach((r, i) => {
    if (r.kind !== 'equal') ix.push(i)
  })
  return ix
})

/** 连续差异行合并为一块（计数与 ‹ › 按块跳转） */
const lineDiffMismatchBlocks = computed(() => {
  const ix = lineDiffChangeIndexes.value
  if (ix.length === 0) return [] as { start: number; end: number }[]
  const blocks: { start: number; end: number }[] = []
  let s = ix[0]!
  let e = ix[0]!
  for (let j = 1; j < ix.length; j++) {
    const cur = ix[j]!
    if (cur === e + 1) e = cur
    else {
      blocks.push({ start: s, end: e })
      s = cur
      e = cur
    }
  }
  blocks.push({ start: s, end: e })
  return blocks
})

const lineDiffMismatchCount = computed(() => lineDiffMismatchBlocks.value.length)

const lineDiffNavIndex = ref(0)

watch(compareTextA, (v) => {
  if (outputTab.value !== 'compare' || compareDraftSync) return
  inputJson.value = v
})

watch(compareTextB, (v) => {
  if (outputTab.value !== 'compare' || compareDraftSync) return
  compareJson.value = v
})

watch(outputTab, (t) => {
  if (t !== 'compare') {
    lineDiffNavIndex.value = 0
    return
  }
  compareDraftSync = true
  const la = lineDiffLeftSource.value
  const lb = lineDiffRightSource.value
  compareTextA.value = la
  compareTextB.value = lb
  inputJson.value = la
  compareJson.value = lb
  void nextTick(() => {
    compareDraftSync = false
    lineDiffNavIndex.value = 0
  })
})

watch(lineDiffMismatchBlocks, (blocks) => {
  if (lineDiffNavIndex.value >= blocks.length) {
    lineDiffNavIndex.value = Math.max(0, blocks.length - 1)
  }
})

function lineDiffRowBgClass(kind: LineDiffKind) {
  return lineDiffRowBg(kind)
}

function lineDiffRowFocusClass(i: number): string {
  const blocks = lineDiffMismatchBlocks.value
  if (blocks.length === 0) return ''
  const nav = lineDiffNavIndex.value
  const b = blocks[nav]
  if (!b) return ''
  // 只标块首行，避免一侧多行对齐时空行堆叠多层描边
  if (i === b.start) return 'relative z-[1] shadow-[inset_0_0_0_2px_rgba(37,99,235,0.65)]'
  return ''
}

const lineDiffLeftTaRef = ref<HTMLTextAreaElement | null>(null)
const lineDiffRightTaRef = ref<HTMLTextAreaElement | null>(null)
const lineDiffLeftMirrorRef = ref<HTMLElement | null>(null)
const lineDiffRightMirrorRef = ref<HTMLElement | null>(null)
const lineDiffLeftGutterRef = ref<HTMLElement | null>(null)
const lineDiffRightGutterRef = ref<HTMLElement | null>(null)
const lineDiffLeftMarkRef = ref<HTMLElement | null>(null)
const lineDiffRightMarkRef = ref<HTMLElement | null>(null)
let lineDiffScrollSync = false

const LINE_DIFF_LINE_PX = 24

function syncCompareLeftMirrorScroll() {
  const ta = lineDiffLeftTaRef.value
  const m = lineDiffLeftMirrorRef.value
  if (ta && m) m.scrollTop = ta.scrollTop
}

function syncCompareRightMirrorScroll() {
  const ta = lineDiffRightTaRef.value
  const m = lineDiffRightMirrorRef.value
  if (ta && m) m.scrollTop = ta.scrollTop
}

function syncCompareLeftGutterScroll() {
  const ta = lineDiffLeftTaRef.value
  const g = lineDiffLeftGutterRef.value
  const mk = lineDiffLeftMarkRef.value
  if (ta && g) g.scrollTop = ta.scrollTop
  if (ta && mk) mk.scrollTop = ta.scrollTop
}

function syncCompareRightGutterScroll() {
  const ta = lineDiffRightTaRef.value
  const g = lineDiffRightGutterRef.value
  const mk = lineDiffRightMarkRef.value
  if (ta && g) g.scrollTop = ta.scrollTop
  if (ta && mk) mk.scrollTop = ta.scrollTop
}

function onCompareLeftPaneScroll() {
  syncCompareLeftMirrorScroll()
  syncCompareLeftGutterScroll()
  onLineDiffScroll('left')
}

function onCompareRightPaneScroll() {
  syncCompareRightMirrorScroll()
  syncCompareRightGutterScroll()
  onLineDiffScroll('right')
}

function onLineDiffScroll(source: 'left' | 'right') {
  if (lineDiffScrollSync) return
  const a = lineDiffLeftTaRef.value
  const b = lineDiffRightTaRef.value
  if (!a || !b) return
  lineDiffScrollSync = true
  if (source === 'left') b.scrollTop = a.scrollTop
  else a.scrollTop = b.scrollTop
  syncCompareLeftMirrorScroll()
  syncCompareRightMirrorScroll()
  syncCompareLeftGutterScroll()
  syncCompareRightGutterScroll()
  requestAnimationFrame(() => {
    lineDiffScrollSync = false
  })
}

function jumpLineDiff(delta: -1 | 1) {
  const blocks = lineDiffMismatchBlocks.value
  if (blocks.length === 0) return
  const n = lineDiffNavIndex.value + delta
  if (n < 0 || n >= blocks.length) return
  lineDiffNavIndex.value = n
  const rowIdx = blocks[n]!.start
  void nextTick(() => {
    const a = lineDiffLeftTaRef.value
    const b = lineDiffRightTaRef.value
    if (!a || !b) return
    const rowTop = rowIdx * LINE_DIFF_LINE_PX
    const centerOff = a.clientHeight / 2 - LINE_DIFF_LINE_PX / 2
    const y = Math.max(0, Math.min(rowTop - centerOff, Math.max(0, a.scrollHeight - a.clientHeight)))
    const yb = Math.min(y, Math.max(0, b.scrollHeight - b.clientHeight))
    lineDiffScrollSync = true
    a.scrollTop = y
    b.scrollTop = yb
    syncCompareLeftMirrorScroll()
    syncCompareRightMirrorScroll()
    syncCompareLeftGutterScroll()
    syncCompareRightGutterScroll()
    requestAnimationFrame(() => {
      lineDiffScrollSync = false
    })
  })
}

function compareRowStripeOnly(row: StructuralDiffRow): string {
  let stripe = ''
  if (row.gutter === '=') stripe = ''
  else if (row.gutter === '≠') stripe = 'border-l-[3px] border-l-amber-500'
  else if (row.gutter === 'A') stripe = 'border-l-[3px] border-l-rose-500'
  else stripe = 'border-l-[3px] border-l-emerald-500'
  return `border-b border-slate-100/90 ${stripe}`
}

function compareGutterTextClass(row: StructuralDiffRow): string {
  switch (row.gutter) {
    case '=':
      return 'text-slate-500'
    case '≠':
      return 'text-amber-800'
    case 'A':
      return 'text-rose-700'
    case 'B':
      return 'text-emerald-700'
    default:
      return 'text-slate-700'
  }
}

function compareGutterTitle(row: StructuralDiffRow): string {
  switch (row.mismatch) {
    case 'equal':
      return '同路径下值一致'
    case 'type':
      return '同一路径下类型不一致'
    case 'value':
      return '同一路径下值不一致'
    case 'missing':
      return row.gutter === 'A' ? '仅 A 有此键或数组项' : '仅 B 有此键或数组项'
    default:
      return ''
  }
}

const fileInputRef = ref<HTMLInputElement | null>(null)

const inputLineCount = computed(() => lineCountFor(inputJson.value))

const inputTabSize = computed(() => (indentMode.value === 'tab' ? 4 : Number(indentMode.value)))

/** 与「缩进」选项一致：CodeMirror Tab / 多行缩进插入内容 */
const editorSingleIndent = computed(() => {
  const g = getIndent(indentMode.value)
  return g === '\t' ? '\t' : ' '.repeat(g as number)
})

function formatHistoryTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toggleHistoryPanel() {
  historyPanelOpen.value = !historyPanelOpen.value
}

function loadHistoryEntry(h: { id: string; content: string }) {
  inputJson.value = h.content
  historyPanelOpen.value = false
  void nextTick(() => {
    applyPrettyFromInput()
    if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
  })
}

async function onClearHistory() {
  await jsonHist.clearAll()
  showToast('已清空历史')
}

function writeOutputForParsed(v: unknown, asMinified: boolean) {
  if (sortKeys.value) {
    outputJson.value = asMinified
      ? JSON.stringify(v)
      : JSON.stringify(v, null, getIndent(indentMode.value))
    return
  }
  const { slice } = sliceForJsonParse(inputJson.value)
  const orders = slice ? extractSourceKeyOrders(slice) : null
  if (!orders) {
    outputJson.value = asMinified
      ? JSON.stringify(v)
      : JSON.stringify(v, null, getIndent(indentMode.value))
    return
  }
  outputJson.value = asMinified
    ? stringifyCompactWithSourceOrder(v, orders)
    : stringifyPrettyWithSourceOrder(v, orders, indentMode.value)
}

function applyParsed(value: unknown, asMinified: boolean) {
  let v = value
  if (sortKeys.value) v = sortKeysDeep(v)
  lastParsed.value = v
  writeOutputForParsed(v, asMinified)
  error.value = ''
  errorIndexInRaw.value = null
  void jsonHist.recordSnapshot(inputJson.value)
}

/** 根据当前输入解析并输出美化结果（与「格式化」一致）；输入为空则清空输出 */
function applyPrettyFromInput() {
  const raw = inputJson.value
  if (!sliceForJsonParse(raw).slice) {
    error.value = ''
    errorIndexInRaw.value = null
    outputJson.value = ''
    lastParsed.value = null
    return
  }
  const result = parseJson(raw)
  if (!result.ok) {
    error.value = result.message
    errorIndexInRaw.value = result.errorIndexInRaw
    lastParsed.value = null
    return
  }
  applyParsed(result.value, false)
}

function formatJson() {
  applyPrettyFromInput()
  void nextTick(() => {
    if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
  })
}

function compressJson() {
  const raw = inputJson.value
  const result = parseJson(raw)
  if (!result.ok) {
    error.value = result.message
    errorIndexInRaw.value = result.errorIndexInRaw
    lastParsed.value = null
    return
  }
  applyParsed(result.value, true)
  void nextTick(() => {
    if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
  })
}

/** 先压缩为单行，再把结果写入剪贴板 */
async function compressJsonAndCopy() {
  compressJson()
  if (error.value) return
  await nextTick()
  await copyOutput()
}

/** 从顶栏「打开工具」等入口写入原文，并同步左侧输入为当前缩进下的美化结果 */
function applyPrefillRaw(raw: string) {
  inputJson.value = raw
  void nextTick(() => {
    applyPrettyFromInput()
    if (!error.value && outputJson.value) {
      inputJson.value = outputJson.value
    }
    void nextTick(() => {
      if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
    })
  })
}

watch(jsonPrefillState, (v) => {
  if (v == null || !import.meta.client) return
  const raw = consumeJsonPrefill()
  if (raw) applyPrefillRaw(raw)
})

watch(indentMode, () => {
  if (outputJson.value && lastParsed.value !== null && !error.value) {
    try {
      writeOutputForParsed(lastParsed.value, false)
    } catch {
      /* ignore */
    }
  }
  void nextTick(() => {
    if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
  })
})

watch(sortKeys, () => {
  applyPrettyFromInput()
  void nextTick(() => {
    if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
  })
})

let inputValidateTimer: ReturnType<typeof setTimeout> | null = null
watch(inputJson, () => {
  if (inputValidateTimer) clearTimeout(inputValidateTimer)
  inputValidateTimer = setTimeout(() => {
    inputValidateTimer = null
    applyPrettyFromInput()
  }, 280)
})

let compareValidateTimer: ReturnType<typeof setTimeout> | null = null
watch(compareJson, () => {
  if (compareValidateTimer) clearTimeout(compareValidateTimer)
  compareValidateTimer = setTimeout(() => {
    compareValidateTimer = null
    const raw = compareJson.value
    if (!sliceForJsonParse(raw).slice) {
      compareError.value = ''
      compareParsed.value = null
      return
    }
    const result = parseJson(raw)
    if (!result.ok) {
      compareError.value = result.message
      compareParsed.value = null
      return
    }
    compareError.value = ''
    compareParsed.value = result.value
  }, 280)
})

function fillCompareFromOutput() {
  const aSide = compareTextA.value.trim()
    ? compareTextA.value
    : inputJson.value.trim()
      ? inputJson.value
      : ''
  const formatted = outputJson.value.trim() ? outputJson.value : ''
  const source = aSide || formatted
  if (!source) {
    showToast('左侧与「文本」结果均为空')
    return
  }
  compareJson.value = source
  if (outputTab.value === 'compare') {
    compareDraftSync = true
    compareTextB.value = source
    void nextTick(() => {
      compareDraftSync = false
    })
  }
}

function swapCompareAB() {
  const a = inputJson.value
  const b = compareJson.value
  inputJson.value = b
  compareJson.value = a
  error.value = ''
  errorIndexInRaw.value = null
  void nextTick(() => {
    applyPrettyFromInput()
    void nextTick(() => {
      if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
    })
  })
}

function clearCompareB() {
  compareJson.value = ''
  compareError.value = ''
  compareParsed.value = null
  if (outputTab.value === 'compare') {
    compareDraftSync = true
    compareTextB.value = ''
    void nextTick(() => {
      compareDraftSync = false
    })
  }
}

const copyOutput = async () => {
  if (!outputJson.value) {
    showToast('没有可复制的内容')
    return
  }
  try {
    await navigator.clipboard.writeText(outputJson.value)
    showToast('已复制结果')
  } catch {
    showToast('复制失败')
  }
}

const copyInput = async () => {
  if (!inputJson.value.trim()) {
    showToast('输入为空')
    return
  }
  try {
    await navigator.clipboard.writeText(inputJson.value)
    showToast('已复制输入')
  } catch {
    showToast('复制失败')
  }
}

function swapPanels() {
  const a = inputJson.value
  const b = outputJson.value
  inputJson.value = b
  outputJson.value = a
  error.value = ''
  errorIndexInRaw.value = null
  void nextTick(() => {
    applyPrettyFromInput()
    if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
  })
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    inputJson.value = String(reader.result ?? '')
    void nextTick(() => {
      applyPrettyFromInput()
      if (outputTab.value === 'compare') refreshCompareDraftsFromModel()
    })
  }
  reader.onerror = () => showToast('读取文件失败')
  reader.readAsText(file, 'UTF-8')
}

function downloadOutput() {
  if (!outputJson.value) return
  const blob = new Blob([outputJson.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.json'
  a.click()
  URL.revokeObjectURL(url)
  showToast('已开始下载')
}

function clearAll() {
  inputJson.value = ''
  outputJson.value = ''
  error.value = ''
  errorIndexInRaw.value = null
  lastParsed.value = null
  compareJson.value = ''
  compareError.value = ''
  compareParsed.value = null
  compareDraftSync = true
  compareTextA.value = ''
  compareTextB.value = ''
  void nextTick(() => {
    compareDraftSync = false
  })
}

onMounted(() => {
  document.addEventListener('click', onDocumentClickCloseErrorPopover)
  const raw = consumeJsonPrefill()
  if (raw) applyPrefillRaw(raw)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClickCloseErrorPopover)
  if (compareValidateTimer) clearTimeout(compareValidateTimer)
})
</script>

<style>
/* JSON 工具栏：白底提示在按钮上方 */
.json-tbar-tip[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  top: auto;
  transform: translateX(-50%);
  padding: 7px 12px;
  font-size: 12px;
  line-height: 1.35;
  font-weight: 500;
  color: rgb(51 65 85);
  text-align: center;
  white-space: nowrap;
  max-width: min(18rem, calc(100vw - 2rem));
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fff;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  box-shadow:
    0 4px 14px rgb(15 23 42 / 0.08),
    0 0 0 1px rgb(15 23 42 / 0.04);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.14s ease,
    visibility 0.14s ease;
  z-index: 200;
}

.json-tbar-tip[data-tip]:hover:not(:disabled)::after {
  opacity: 1;
  visibility: visible;
}

/* v-html 注入的标记不受 Vue scoped 影响 */
.json-ld-chg {
  padding: 0 0.06em;
  border-radius: 2px;
}
.json-ld-chg-del {
  background-color: rgb(252 165 165 / 0.92);
}
.json-ld-chg-add {
  background-color: rgb(134 239 172 / 0.92);
}

.json-compare-ld-mirror {
  margin: 0;
}
</style>
