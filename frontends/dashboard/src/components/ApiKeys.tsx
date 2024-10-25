import { Show, createMemo, createSignal, useContext } from "solid-js";
import { FaRegularTrashCan } from "solid-icons/fa";
import { ApiKeyGenerateModal } from "./ApiKeyGenerateModal";
import { UserContext } from "../contexts/UserContext";
import {
  ApiKeyRespBody,
  fromI32ToApiKeyRole,
  fromI32ToUserRole,
} from "shared/types";
import { formatDate } from "../utils/formatters";
import { createMutation, createQuery } from "@tanstack/solid-query";
import { useTrieve } from "../hooks/useTrieve";
import {
  createColumnHelper,
  createSolidTable,
  getCoreRowModel,
} from "@tanstack/solid-table";
import { TanStackTable } from "shared/ui";

const colHelp = createColumnHelper<ApiKeyRespBody>();

export const ApiKeys = () => {
  const userContext = useContext(UserContext);

  const [openModal, setOpenModal] = createSignal<boolean>(false);

  const currentUserRole = createMemo(() => {
    const selectedOrgId = userContext.selectedOrg().id;
    return (
      userContext
        .user?.()
        ?.user_orgs.find(
          (user_org) => user_org.organization_id === selectedOrgId,
        )?.role ?? 0
    );
  });

  const trieve = useTrieve();

  const apiKeysQuery = createQuery(() => ({
    queryKey: ["apiKeys", userContext.selectedOrg().id],
    queryFn: () => {
      return trieve.fetch<"eject">(`/api/user/api_key`, "get", {}) as Promise<
        ApiKeyRespBody[]
      >;
    },
  }));

  const deleteApiKeyMutation = createMutation(() => ({
    mutationFn: async (id: string) => {
      return await trieve.fetch("/api/user/api_key/{api_key_id}", "delete", {
        apiKeyId: id,
      });
    },
    onSuccess() {
      void apiKeysQuery.refetch();
    },
  }));

  const table = createMemo(() => {
    if (!apiKeysQuery.data) {
      return null;
    }
    const columns = [
      colHelp.accessor("id", {
        header: "ID",
      }),
      colHelp.accessor("name", {
        header: "Name",
      }),
      colHelp.accessor("role", {
        header: "Perms",
        cell: (info) => {
          if (currentUserRole() > 0) {
            return fromI32ToUserRole(info.getValue());
          }
          return fromI32ToApiKeyRole(info.getValue());
        },
      }),
      colHelp.accessor("dataset_ids", {
        header: "Datasets",
        cell: (info) => {
          return info.getValue()?.join(",");
        },
      }),
      colHelp.accessor("organization_ids", {
        header: "Organizations",
        cell: (info) => {
          return info.getValue()?.join(",");
        },
      }),
      colHelp.accessor("created_at", {
        header: "Created At",
        cell: (info) => {
          return formatDate(new Date(info.getValue()));
        },
      }),
      colHelp.display({
        header: " ",
        cell: (info) => {
          return (
            <button
              type="button"
              class="inline-flex justify-center px-3 py-2 text-sm text-red-500"
              onClick={(e) => {
                e.preventDefault();
                const result = window.confirm(
                  "Are you sure you want to delete this API key?",
                );
                if (!result) {
                  return;
                }
                deleteApiKeyMutation.mutate(info.row.original.id);
              }}
            >
              <FaRegularTrashCan class="h-4 w-4" />
            </button>
          );
        },
      }),
    ];
    return createSolidTable({
      columns: columns,
      data: apiKeysQuery.data,
      getCoreRowModel: getCoreRowModel(),
    });
  });

  return (
    <>
      <div class="flex flex-col">
        <div class="flex items-end justify-between pb-2">
          <div class="text-lg font-medium">API Keys</div>
          <button
            type="button"
            class={
              "inline-flex justify-center rounded-md bg-magenta-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-magenta-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta-900"
            }
            onClick={(e) => {
              e.preventDefault();
              setOpenModal(true);
            }}
          >
            Create New Key +
          </button>
        </div>
        <Show when={apiKeysQuery.data?.length === 0}>
          <div class="rounded-md border-[0.5px] border-neutral-300 bg-white py-4 text-center text-sm text-gray-500 shadow-sm">
            No API Keys
          </div>
        </Show>
        <Show when={(apiKeysQuery.data?.length || -1) > 0}>
          <div class="inline-block min-w-full overflow-x-auto rounded-md border-[0.5px] border-neutral-300 bg-white align-middle shadow-sm">
            <Show when={table()}>
              {(table) => <TanStackTable table={table()} />}
            </Show>
          </div>
        </Show>
      </div>
      <ApiKeyGenerateModal
        onCreated={() => {
          void apiKeysQuery.refetch();
        }}
        openModal={openModal}
        closeModal={() => setOpenModal(false)}
      />
    </>
  );
};
