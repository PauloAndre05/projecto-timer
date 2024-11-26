import { useEffect, useState } from "react";
import { HandPalm, Play } from "phosphor-react";

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as zod from "zod"
import { differenceInSeconds } from "date-fns"; 

import { 
    CountdownContainer, 
    ErrorForm, 
    FormContainer, 
    HomeContainer, 
    MinuteAmountInput, 
    Separator, 
    StartCountdownButton, 
    StopCountdownButton, 
    TaskInput,
} from "./styles";

const newCycleFormValidationSchema = zod.object({
    task: zod.string().min(1, "Informe a tarefa"),
    minutesAmount: zod.number().min(1, "Mínimo de 1 minutos").max(60, "Máximo de 60 minutos"),
})

type NewCycleFormData = zod.infer<typeof newCycleFormValidationSchema>

interface Cycle {
    id: string,
    task: string,
    minutesAmount: number,
    startDate: Date,
    interruptedDate?: Date,
    finishedDate?: Date,
}

export function Home () {
    const [cycles, setCycles] = useState<Cycle[]>([])
    const [activeCycleId, setActiveCycleId] = useState<string | null>(null)
    const [amountSecondsPassed, setAmountSecondsPassed] = useState(0)

    const { register, handleSubmit, formState:{errors}, reset } = useForm<NewCycleFormData>({
        resolver: zodResolver(newCycleFormValidationSchema),
        defaultValues: {
            task: '',
            minutesAmount: 0        }
    })

    function handleCreatNewCycle (data: NewCycleFormData) {
        const id = String(new Date().getTime())
        const newCycle: Cycle = {
            id,
            task: data.task,
            minutesAmount: data.minutesAmount, 
            startDate: new Date(),
        }

        setCycles(state => [...state, newCycle])
        setActiveCycleId(id)
        setAmountSecondsPassed(0)
        reset()
    }

    const activeCycle = cycles.find(cycle => cycle.id === activeCycleId)

    const  totalSeconds = activeCycle ? activeCycle.minutesAmount * 60 : 0
    
    
    useEffect(() => {
        let interval: number
        if (activeCycle) {
            interval = setInterval(() => {
                const secondsDifference = differenceInSeconds(new Date(), activeCycle.startDate)
                if(secondsDifference >= totalSeconds) {
                    setCycles(state =>
                        state.map((cycle => {
                            if(cycle.id === activeCycleId) {
                                return {... cycle, finishedDate: new Date()}
                            } else {
                                return cycle
                            }
                        }))
                    )
                    
                    setAmountSecondsPassed(totalSeconds)

                    clearInterval(interval)
                    setActiveCycleId(null)

                } else {
                    setAmountSecondsPassed(secondsDifference)
                }
            }, 1000)
        }

        return () => {
            clearInterval(interval)
        }
    } ,[activeCycle, totalSeconds,  activeCycleId])
    
    function handleInterruptCycle () {
        setCycles(state =>
            state.map((cycle => {
                if(cycle.id === activeCycleId) {
                    return {... cycle, interruptedDate: new Date()}
                } else {
                    return cycle
                }
            }))
        )
        setActiveCycleId(null)
    }
    
    const currentSeconds = activeCycle ? totalSeconds - amountSecondsPassed : 0

    const minutesAmount = Math.floor(currentSeconds / 60)
    const secondsAmount = currentSeconds % 60

    const minutes = String(minutesAmount).padStart(2, '0')
    const seconds = String(secondsAmount).padStart(2, '0')

    useEffect(() => {
        if(activeCycle) {
            document.title = `${minutes}:${seconds}`
        }
    }, [minutes, seconds, activeCycle])

    return(
        <HomeContainer>
            <form onSubmit={handleSubmit(handleCreatNewCycle)}>
                <FormContainer>
                    <label htmlFor="task">Vou trabalhar em</label>
                    <TaskInput 
                        type="text" 
                        id="task" 
                        placeholder="Dê um nome para o seu projeto"
                        list="task-suggestions"
                        disabled={!!activeCycle}
                        {...register("task")}
                    />
                    {errors.task?.message && (
                        <ErrorForm>{errors.task?.message}</ErrorForm>
                    )}

                    <datalist id="task-suggestions">
                        <option value="Projeto 1" />
                        <option value="Projeto 2" />
                        <option value="Projeto 3" />
                        <option value="Banana" />
                    </datalist>

                    <label htmlFor="minutesAmount">durante</label>
                    <MinuteAmountInput 
                        type="number"
                        id="minutesAmount" 
                        placeholder="00"
                        step={5}
                        max={60}
                        min={1}
                        disabled={!!activeCycle}
                        {...register("minutesAmount", {valueAsNumber: true})}
                    />
                    {errors.minutesAmount?.message && (
                        <ErrorForm>{errors.minutesAmount?.message}</ErrorForm>
                    )}

                    <span>minutos.</span>
                </FormContainer>

                <CountdownContainer>
                    <span>{minutes[0]}</span>
                    <span>{minutes[1]}</span>
                    <Separator>:</Separator>
                    <span>{seconds[0]}</span>
                    <span>{seconds[1]}</span>
                </CountdownContainer>

                {activeCycle ? (
                    <StopCountdownButton onClick={handleInterruptCycle} type="button">
                        <HandPalm size={24} />
                        Interromper
                    </StopCountdownButton>
                ) : (
                    <StartCountdownButton type="submit">
                        <Play size={24} />
                        Começar
                    </StartCountdownButton>
                )}
            </form>
        </HomeContainer>
    )
} 