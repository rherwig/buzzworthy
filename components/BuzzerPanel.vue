<script setup lang="ts">
import type { Seat, StateClue } from '~~/shared/game'
import { UiModal } from '~/ui'

/**
 * The open clue as a *player* sees it on its own device: the prompt and one big
 * buzzer.
 *
 * Deliberately not the host's `ClueDialog` filtered down to a single seat — a buzzer
 * is a reflex control, so it gets the whole screen, the label `BUZZ` instead of the
 * player's own name, and explicit states. `pressed` is shown the moment the button is
 * hit, before the server has answered, so the press never feels lost to latency; the
 * next authoritative state overrides it.
 *
 * Answers are spoken out loud (docs/JEOPARDY.md Q1f), so there is no answer input.
 *
 * The scores travel into the dialog for the same reason as in `ClueDialog`: a modal hides
 * the page behind it from assistive tech.
 */
const props = defineProps<{
    clue: StateClue
    /** Seat this device plays; `null` for a spectator, who only watches. */
    seat: Seat | null
    activeSeat: Seat | null
    /** All seats, so the scores stay reachable while the modal hides the page behind it. */
    seats?: readonly Seat[]
    /** This seat already answered wrong on this clue and may not buzz again. */
    locked?: boolean
    /** Accepted Daily Double wager: it replaces the clue value and closes the buzzers. */
    wager?: number | null
}>()

const emit = defineEmits<{
    buzz: [seatIndex: number]
}>()

/** Local, optimistic acknowledgement of a press; cleared by every state change. */
const pressed = ref(false)

type BuzzerStatus = 'watching' | 'won' | 'taken' | 'locked' | 'pressed' | 'ready'

const status = computed<BuzzerStatus>(() => {
    if (props.seat === null) {
        return 'watching'
    }

    if (props.activeSeat !== null) {
        return props.activeSeat.index === props.seat.index ? 'won' : 'taken'
    }

    if (props.locked === true || props.wager != null) {
        return 'locked'
    }

    return pressed.value ? 'pressed' : 'ready'
})

const ready = computed(() => status.value === 'ready')

const label = computed(() => {
    switch (status.value) {
        case 'pressed':
            return 'Buzzed…'
        case 'won':
            return "You're in!"
        case 'taken':
            return `${props.activeSeat?.name ?? 'Someone'} buzzed`
        case 'locked':
            return 'Locked out'
        default:
            return 'BUZZ'
    }
})

const buttonClass = computed(() => {
    switch (status.value) {
        case 'won':
            return 'bg-primary text-primary-foreground ring-4 ring-primary'
        case 'pressed':
            return 'scale-95 bg-primary-hover text-primary-foreground'
        case 'taken':
        case 'locked':
            return 'cursor-not-allowed border border-border bg-surface text-muted'
        default:
            return 'bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95'
    }
})

// A new clue (or any adjudication) invalidates the optimistic acknowledgement.
watch(
    () => [props.clue.id, props.activeSeat?.index ?? null, props.locked === true] as const,
    () => {
        pressed.value = false
    },
)

function press(): void {
    if (!ready.value || props.seat === null) {
        return
    }

    pressed.value = true
    navigator.vibrate?.(60)
    emit('buzz', props.seat.index)
}

/** A buzzer must not require aiming: the keyboard triggers it wherever focus is. */
function onKeydown(event: KeyboardEvent): void {
    if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) {
        return
    }

    event.preventDefault()
    press()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
    <UiModal :open="true" size="xl" :dismissible="false">
        <template #title>
            <span class="text-muted">{{ wager ?? clue.value }}</span>
            <span v-if="clue.isDailyDouble" class="ml-2 text-primary">Daily Double</span>
        </template>

        <p class="text-center text-xl font-semibold sm:text-3xl">{{ clue.prompt }}</p>

        <p v-if="status === 'watching'" class="mt-8 text-center text-sm text-muted">
            You are watching this game.
        </p>

        <div v-else class="mt-8">
            <button
                type="button"
                data-testid="buzzer"
                :disabled="!ready"
                :aria-label="`Buzz for ${seat?.name ?? ''}`"
                class="h-32 w-full touch-manipulation select-none rounded-2xl text-3xl font-black uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary disabled:pointer-events-none sm:h-40 sm:text-4xl"
                :class="buttonClass"
                @click="press"
            >
                {{ label }}
            </button>

            <p class="mt-3 text-center text-xs text-muted" aria-live="polite">
                <template v-if="ready">Space or Enter buzzes too.</template>
                <template v-else-if="status === 'locked'">Wait for the next clue.</template>
                <template v-else-if="status === 'pressed'">Waiting for the host…</template>
            </p>
        </div>

        <ScoreBoard
            v-if="seats"
            class="mt-8"
            compact
            :seats="seats"
            :active-seat-index="activeSeat?.index"
        />
    </UiModal>
</template>
