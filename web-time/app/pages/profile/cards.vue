<template>
  <div class="px-4 py-4 space-y-4">
    <p class="text-sm text-slate-600 leading-relaxed">
      配置生活分类与子项。写记录时先选分类，再选具体事项；无子项的分类可直接记录。
    </p>

    <div class="doc-surface overflow-hidden">
      <van-collapse v-model="expanded" :border="false">
        <van-collapse-item
          v-for="card in cards"
          :key="card.id"
          :name="card.id"
          :title="card.label"
        >
          <template #title>
            <div class="flex items-center gap-3 py-0.5">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                :class="LIFE_CARD_COLORS[card.color].bg"
              >
                <van-icon
                  :name="card.icon"
                  size="18"
                  :class="LIFE_CARD_COLORS[card.color].text"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-900">{{ card.label }}</p>
                <p class="text-xs text-slate-500">{{ childSummary(card) }}</p>
              </div>
            </div>
          </template>

          <div class="space-y-2 pb-1">
            <div class="flex flex-wrap gap-2">
              <van-button size="small" plain type="primary" @click="openEdit(card)">
                编辑分类
              </van-button>
              <van-button size="small" plain @click="openAddChild(card)">
                添加子项
              </van-button>
              <van-button size="small" plain type="danger" @click="confirmRemove(card)">
                删除分类
              </van-button>
            </div>

            <van-cell-group v-if="(card.children?.length ?? 0) > 0" :border="false" class="rounded-xl overflow-hidden border border-slate-100">
              <van-swipe-cell v-for="child in card.children" :key="child.id">
                <van-cell
                  :title="child.label"
                  clickable
                  @click.stop="openEditChild(card, child)"
                />
                <template #right>
                  <van-button
                    square
                    type="danger"
                    text="删除"
                    class="!h-full"
                    @click="handleRemoveChild(card.id, child.id)"
                  />
                </template>
              </van-swipe-cell>
            </van-cell-group>

            <p v-else class="text-xs text-slate-400 py-2">暂无子项，可直接记录该分类</p>
          </div>
        </van-collapse-item>
      </van-collapse>

      <div class="p-3 border-t border-slate-100 flex flex-col gap-2">
        <van-button block type="primary" icon="plus" @click="openCreate">
          添加分类
        </van-button>
        <van-button block plain type="default" @click="handleReset">
          恢复默认
        </van-button>
      </div>
    </div>

    <van-popup v-model:show="editorOpen" round position="bottom" safe-area-inset-bottom>
      <div class="p-4 pb-6">
        <h3 class="text-base font-semibold text-slate-900 mb-4">
          {{ editingId ? '编辑分类' : '添加分类' }}
        </h3>
        <van-field v-model="draft.label" label="名称" placeholder="如：日常、运动" maxlength="8" />
        <van-field label="图标">
          <template #input>
            <div class="flex flex-wrap gap-2 py-1">
              <button
                v-for="icon in LIFE_CARD_ICON_OPTIONS"
                :key="icon"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                :class="draft.icon === icon
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 text-slate-500'"
                @click="draft.icon = icon"
              >
                <van-icon :name="icon" size="18" />
              </button>
            </div>
          </template>
        </van-field>
        <van-field label="颜色">
          <template #input>
            <div class="flex flex-wrap gap-2 py-1">
              <button
                v-for="(style, color) in LIFE_CARD_COLORS"
                :key="color"
                type="button"
                class="h-8 w-8 rounded-full ring-offset-2 transition-all"
                :class="[
                  style.bg,
                  draft.color === color ? `ring-2 ${style.ring}` : ''
                ]"
                @click="draft.color = color"
              />
            </div>
          </template>
        </van-field>
        <div class="mt-4 flex gap-3">
          <van-button round block plain @click="editorOpen = false">取消</van-button>
          <van-button round block type="primary" class="!border-0 !bg-indigo-600" @click="saveDraft">
            保存
          </van-button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="childEditorOpen" round position="bottom" safe-area-inset-bottom>
      <div class="p-4 pb-6">
        <h3 class="text-base font-semibold text-slate-900 mb-1">
          {{ childEditingId ? '编辑子项' : '添加子项' }}
        </h3>
        <p v-if="childParent" class="text-xs text-slate-500 mb-4">所属分类：{{ childParent.label }}</p>
        <van-field
          v-model="childDraftLabel"
          label="名称"
          placeholder="如：做饭、会议"
          maxlength="12"
        />
        <div class="mt-4 flex gap-3">
          <van-button round block plain @click="childEditorOpen = false">取消</van-button>
          <van-button round block type="primary" class="!border-0 !bg-indigo-600" @click="saveChildDraft">
            保存
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { showConfirmDialog, showToast } from 'vant'
import {
  LIFE_CARD_COLORS,
  LIFE_CARD_ICON_OPTIONS,
  type LifeCard,
  type LifeCardChild,
  type LifeCardColor,
  useLifeCards
} from '~/composables/useLifeCards'

useHead({ title: '生活卡片 · Nexus Time' })

const {
  cards,
  load,
  addCard,
  updateCard,
  removeCard,
  addChild,
  updateChild,
  removeChild,
  resetDefaults
} = useLifeCards()

const expanded = ref<string[]>([])
const editorOpen = ref(false)
const editingId = ref<string | null>(null)

const childEditorOpen = ref(false)
const childParent = ref<LifeCard | null>(null)
const childEditingId = ref<string | null>(null)
const childDraftLabel = ref('')

const draft = reactive({
  label: '',
  icon: 'flower-o' as string,
  color: 'slate' as LifeCardColor
})

onMounted(() => {
  load()
  if (cards.value.length > 0) {
    expanded.value = [cards.value[0].id]
  }
})

function childSummary (card: LifeCard) {
  const n = card.children?.length ?? 0
  return n > 0 ? `${n} 个子项` : '无子项'
}

function openCreate () {
  editingId.value = null
  draft.label = ''
  draft.icon = 'flower-o'
  draft.color = 'slate'
  editorOpen.value = true
}

function openEdit (card: LifeCard) {
  editingId.value = card.id
  draft.label = card.label
  draft.icon = card.icon
  draft.color = card.color
  editorOpen.value = true
}

function openAddChild (card: LifeCard) {
  childParent.value = card
  childEditingId.value = null
  childDraftLabel.value = ''
  childEditorOpen.value = true
}

function openEditChild (card: LifeCard, child: LifeCardChild) {
  childParent.value = card
  childEditingId.value = child.id
  childDraftLabel.value = child.label
  childEditorOpen.value = true
}

function saveDraft () {
  const label = draft.label.trim()
  if (!label) {
    showToast('请填写名称')
    return
  }

  if (editingId.value) {
    updateCard(editingId.value, {
      label,
      icon: draft.icon,
      color: draft.color
    })
  } else {
    addCard({
      label,
      icon: draft.icon,
      color: draft.color,
      category: 'other',
      children: []
    })
  }

  editorOpen.value = false
  showToast('已保存')
}

function saveChildDraft () {
  if (!childParent.value) return
  const label = childDraftLabel.value.trim()
  if (!label) {
    showToast('请填写名称')
    return
  }

  const ok = childEditingId.value
    ? updateChild(childParent.value.id, childEditingId.value, label)
    : addChild(childParent.value.id, label)

  if (!ok) {
    showToast('请填写名称')
    return
  }

  childEditorOpen.value = false
  if (!expanded.value.includes(childParent.value.id)) {
    expanded.value = [...expanded.value, childParent.value.id]
  }
  showToast('已保存')
}

function confirmRemove (card: LifeCard) {
  showConfirmDialog({
    title: '删除分类',
    message: `确定删除「${card.label}」及其全部子项吗？`,
    confirmButtonColor: '#dc2626'
  })
    .then(() => handleRemove(card.id))
    .catch(() => {})
}

function handleRemove (id: string) {
  if (!removeCard(id)) {
    showToast('至少保留一个分类')
  }
}

function handleRemoveChild (parentId: string, childId: string) {
  removeChild(parentId, childId)
}

function handleReset () {
  resetDefaults()
  expanded.value = cards.value.length > 0 ? [cards.value[0].id] : []
  showToast('已恢复默认')
}
</script>

<style scoped>
:deep(.van-collapse-item__title) {
  align-items: center;
}
</style>
