import type { SVGProps } from 'react'

import { useState, useEffect } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import * as Tabs from '@radix-ui/react-tabs'

import { api } from '@/utils/client/api'
/**
 * QUESTION 3:
 * -----------
 * A todo has 2 statuses: "pending" and "completed"
 *  - "pending" state is represented by an unchecked checkbox
 *  - "completed" state is represented by a checked checkbox, darker background,
 *    and a line-through text
 *
 * We have 2 backend apis:
 *  - (1) `api.todo.getAll`       -> a query to get all todos
 *  - (2) `api.todoStatus.update` -> a mutation to update a todo's status
 *
 * Example usage for (1) is right below inside the TodoList component. For (2),
 * you can find similar usage (`api.todo.create`) in src/client/components/CreateTodoForm.tsx
 *
 * If you use VSCode as your editor , you should have intellisense for the apis'
 * input. If not, you can find their signatures in:
 *  - (1) src/server/api/routers/todo-router.ts
 *  - (2) src/server/api/routers/todo-status-router.ts
 *
 * Your tasks are:
 *  - Use TRPC to connect the todos' statuses to the backend apis
 *  - Style each todo item to reflect its status base on the design on Figma
 *
 * Documentation references:
 *  - https://trpc.io/docs/client/react/useQuery
 *  - https://trpc.io/docs/client/react/useMutation
 *
 *
 *
 *
 *
 * QUESTION 4:
 * -----------
 * Implement UI to delete a todo. The UI should look like the design on Figma
 *
 * The backend api to delete a todo is `api.todo.delete`. You can find the api
 * signature in src/server/api/routers/todo-router.ts
 *
 * NOTES:
 *  - Use the XMarkIcon component below for the delete icon button. Note that
 *  the icon button should be accessible
 *  - deleted todo should be removed from the UI without page refresh
 *
 * Documentation references:
 *  - https://www.sarasoueidan.com/blog/accessible-icon-buttons
 *
 *
 *
 *
 *
 * QUESTION 5:
 * -----------
 * Animate your todo list using @formkit/auto-animate package
 *
 * Documentation references:
 *  - https://auto-animate.formkit.com
 */

export const TodoList = () => {
  const { data: todos = [] } = api.todo.getAll.useQuery({
    statuses: ['completed', 'pending'],
  })
  const apiContext = api.useContext()

  const [listRef] = useAutoAnimate()

  const isClient = typeof window !== 'undefined'

  const [currentTab, setCurrentTab] = useState<'all' | 'completed' | 'pending'>(
    isClient
      ? (localStorage.getItem('currentTab') as
          | 'all'
          | 'completed'
          | 'pending') || 'all'
      : 'all'
  )

  const { mutateAsync: updateTodoStatusMutation } =
    api.todoStatus.update.useMutation()

  const handleToggleTodoStatus = async (
    todoId: number,
    newStatus: 'completed' | 'pending'
  ) => {
    try {
      if (newStatus === 'pending') {
        await updateTodoStatusMutation({ todoId, status: 'completed' })
      } else {
        await updateTodoStatusMutation({ todoId, status: 'pending' })
      }
      apiContext.todo.getAll.refetch()
    } catch (error) {
      // console.error('Error updating todo status:', error)
    }
  }

  const { mutate: DeleteTodo } = api.todo.delete.useMutation({
    onSuccess: () => {
      apiContext.todo.getAll.refetch()
    },
  })

  const sortedTodos = todos.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') {
      return 1
    }
    if (a.status !== 'completed' && b.status === 'completed') {
      return -1
    }
    return b.id - a.id
  })

  const TabItems: React.FC = () => {
    const handleTabSelect = (tab: 'all' | 'completed' | 'pending') => {
      setCurrentTab(tab)
    }

    useEffect(() => {
      if (isClient) {
        localStorage.setItem('currentTab', currentTab)
      }
    }, [])

    return (
      <Tabs.Root className="grid grid-cols-1 pb-10">
        <Tabs.List aria-label="Filter todos" className="flex gap-x-3">
          <Tabs.Trigger
            value="all"
            className={`
              align-center font-Manrope flex justify-center rounded-full px-6 py-3 text-sm font-bold
              ${
                currentTab === 'all'
                  ? 'bg-gray-700 text-white'
                  : 'border border-gray-200 text-gray-700'
              }
            `}
            onClick={() => handleTabSelect('all')}
          >
            All
          </Tabs.Trigger>
          <Tabs.Trigger
            value="pending"
            className={`
              align-center font-Manrope flex justify-center rounded-full px-6 py-3 text-sm font-bold
              ${
                currentTab === 'pending'
                  ? 'bg-gray-700 text-white'
                  : 'border border-gray-200 text-gray-700'
              }
            `}
            onClick={() => handleTabSelect('pending')}
          >
            Pending
          </Tabs.Trigger>
          <Tabs.Trigger
            value="completed"
            className={`
              align-center font-Manrope flex justify-center rounded-full px-6 py-3 text-sm font-bold
              ${
                currentTab === 'completed'
                  ? 'bg-gray-700 text-white'
                  : 'border border-gray-200 text-gray-700'
              }
            `}
            onClick={() => handleTabSelect('completed')}
          >
            Completed
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    )
  }
  const filteredTodos = sortedTodos.filter((todo) => {
    if (currentTab === 'all') {
      return true
    }
    if (currentTab === 'completed') {
      return todo.status === 'completed'
    }
    if (currentTab === 'pending') {
      return todo.status === 'pending'
    }
    return false
  })

  return (
    <>
      <TabItems />
      <ul className="grid grid-cols-1 gap-y-3" ref={listRef}>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <div
              className={`
                shadow-s flex items-center rounded-12 border border-gray-200 px-4 py-3
                ${todo.status === 'completed' ? `bg-gray-50` : ``}  
              `}
            >
              <Checkbox.Root
                checked={todo.status === 'completed'}
                onClick={() => {
                  handleToggleTodoStatus(todo.id, todo.status)
                }}
                id={String(todo.id)}
                className="flex h-6 w-6 items-center justify-center rounded-6 border border-gray-300 focus:border-gray-700 focus:outline-none data-[state=checked]:border-gray-700 data-[state=checked]:bg-gray-700"
              >
                <Checkbox.Indicator>
                  <CheckIcon className="h-4 w-4 text-white shadow-sm" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                className={`block flex-grow pl-3 font-medium 
                  ${todo.status === 'completed' ? `line-through` : ``}`}
                htmlFor={String(todo.id)}
              >
                {todo.body}
              </label>
              <XMarkIcon
                className="ml-4 flex h-8 w-8 items-center justify-end p-1 hover:cursor-pointer"
                onClick={() => {
                  DeleteTodo({
                    id: todo.id,
                  })
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

const XMarkIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

const CheckIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  )
}
