<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let activeTab = 'configurations'; // 'configurations', 'documents', 'stats', 'jobs'

	// Vector database configurations
	let vectorDbConfigs: any[] = [];
	let supportedProviders: any[] = [];
	let showCreateConfigForm = false;
	let editingConfig: any = null;

	// Create/Edit configuration form
	let configForm = {
		name: '',
		description: '',
		provider: '',
		config: {} as any,
		is_default: false
	};

	// Document management
	let documents: any[] = [];
	let showUploadForm = false;
	let jsonFileInput: HTMLInputElement;
	let uploadForm = {
		documents: [
			JSON.stringify({
				id: `doc_${Date.now()}`,
				title: "Example Document",
				content: "Your document content goes here...",
				// Add any other fields you need
			}, null, 2)
		],
		api_key_id: ''
	};

	// Statistics
	let ragStats: any = null;

	// Job management for background indexing
	let activeJobs: any[] = [];
	let jobHistory: any[] = [];
	let jobStats: any = null;
	let processInBackground = true;
	let pollingIntervals = new Map();

	onMount(async () => {
		await loadInitialData();
	});

	onDestroy(() => {
		// Clean up polling intervals
		pollingIntervals.forEach((interval) => {
			clearInterval(interval);
		});
		pollingIntervals.clear();
	});

	async function loadInitialData() {
		try {
			loading = true;
			await Promise.all([
				loadVectorDbConfigs(), 
				loadSupportedProviders(), 
				loadRagStats(),
				loadJobData()
			]);
		} catch (err: any) {
			error = err.message || 'Failed to load RAG configuration';
		} finally {
			loading = false;
		}
	}

	async function loadVectorDbConfigs() {
		try {
			const result = await api.getVectorDbConfigs(data.organization_id, data.project._id);
			vectorDbConfigs = result.configurations || [];
		} catch (err: any) {
			console.error('Failed to load vector database configurations:', err);
		}
	}

	async function loadSupportedProviders() {
		try {
			const result = await api.getSupportedVectorDbProviders();
			supportedProviders = result.providers || [];
		} catch (err: any) {
			console.error('Failed to load supported providers:', err);
			// Fallback to default providers if API fails
			supportedProviders = [
				{
					id: 'memory',
					name: 'Memory',
					description: 'In-memory vector storage (temporary)',
					config_schema: {}
				},
				{
					id: 'weaviate',
					name: 'Weaviate',
					description: 'Weaviate vector database',
					config_schema: {
						host: { type: 'string', required: true, description: 'Weaviate host URL' },
						port: { type: 'number', required: false, description: 'Port number' },
						grpc_port: { type: 'number', required: false, description: 'gRPC port number' },
						http_secure: { type: 'boolean', required: false, description: 'Use HTTPS' },
						grpc_secure: { type: 'boolean', required: false, description: 'Use secure gRPC' }
					}
				},
				{
					id: 'pinecone',
					name: 'Pinecone',
					description: 'Pinecone vector database',
					config_schema: {
						api_key: { type: 'string', required: true, description: 'Pinecone API Key' },
						environment: { type: 'string', required: true, description: 'Pinecone environment' },
						index_name: { type: 'string', required: true, description: 'Index name' }
					}
				}
			];
		}
	}

	async function loadRagStats() {
		try {
			const result = await api.getRagStats(data.organization_id, data.project._id);
			ragStats = result.stats || null;
		} catch (err: any) {
			console.error('Failed to load RAG stats:', err);
		}
	}

	async function loadJobData() {
		try {
			const [jobsResult, statsResult] = await Promise.all([
				api.listJobs(data.organization_id, data.project._id),
				api.getJobStats(data.organization_id, data.project._id)
			]);
			
			jobHistory = jobsResult.jobs || [];
			jobStats = statsResult.stats || null;
			
			// Separate active jobs (pending/processing) from completed/failed
			activeJobs = jobHistory.filter(job => 
				job.status === 'pending' || job.status === 'processing'
			);

			// Start polling for active jobs
			activeJobs.forEach(job => {
				if (!pollingIntervals.has(job.job_id)) {
					startJobPolling(job.job_id);
				}
			});
		} catch (err: any) {
			console.error('Failed to load job data:', err);
		}
	}

	function startJobPolling(jobId: string) {
		// Clear any existing interval for this job
		if (pollingIntervals.has(jobId)) {
			clearInterval(pollingIntervals.get(jobId));
		}

		const pollInterval = setInterval(async () => {
			try {
				const result = await api.getJobStatus(data.organization_id, data.project._id, jobId);
				const job = result.job;

				// Update job in both arrays
				const updateJobInArray = (array: any[]) => {
					const index = array.findIndex(j => j.job_id === jobId);
					if (index !== -1) {
						array[index] = job;
					}
				};

				updateJobInArray(activeJobs);
				updateJobInArray(jobHistory);

				// If job is completed or failed, stop polling
				if (job.status === 'completed' || job.status === 'failed') {
					clearInterval(pollInterval);
					pollingIntervals.delete(jobId);
					
					// Remove from active jobs
					activeJobs = activeJobs.filter(j => j.job_id !== jobId);
					
					// Refresh stats if job completed successfully
					if (job.status === 'completed') {
						await loadRagStats();
					}
				}
			} catch (err) {
				console.error(`Failed to poll job ${jobId}:`, err);
				// Stop polling on error
				clearInterval(pollInterval);
				pollingIntervals.delete(jobId);
			}
		}, 5000); // Poll every 5 seconds

		pollingIntervals.set(jobId, pollInterval);
	}

	async function cancelJob(jobId: string) {
		try {
			await api.cancelJob(data.organization_id, data.project._id, jobId);
			await loadJobData(); // Refresh job data
		} catch (err: any) {
			error = err.message || 'Failed to cancel job';
		}
	}

	function openCreateConfigForm() {
		console.log('openCreateConfigForm called');
		configForm = {
			name: '',
			description: '',
			provider: '',
			config: {},
			is_default: false
		};
		editingConfig = null;
		showCreateConfigForm = true;
		console.log('showCreateConfigForm set to:', showCreateConfigForm);
	}

	function openEditConfigForm(config: any) {
		configForm = {
			name: config.name,
			description: config.description || '',
			provider: config.provider,
			config: { ...config.config },
			is_default: config.is_default
		};
		editingConfig = config;
		showCreateConfigForm = true;
	}

	function closeConfigForm() {
		showCreateConfigForm = false;
		editingConfig = null;
		configForm = {
			name: '',
			description: '',
			provider: '',
			config: {},
			is_default: false
		};
	}

	async function saveConfiguration() {
		try {
			loading = true;
			error = '';

			if (editingConfig) {
				await api.updateVectorDbConfig(
					data.organization_id,
					data.project._id,
					editingConfig._id,
					configForm
				);
			} else {
				await api.createVectorDbConfig(data.organization_id, data.project._id, configForm);
			}

			await loadVectorDbConfigs();
			closeConfigForm();
		} catch (err: any) {
			error = err.message || 'Failed to save configuration';
		} finally {
			loading = false;
		}
	}

	async function deleteConfiguration(config: any) {
		if (!confirm(`Are you sure you want to delete the configuration "${config.name}"?`)) {
			return;
		}

		try {
			loading = true;
			await api.deleteVectorDbConfig(data.organization_id, data.project._id, config._id);
			await loadVectorDbConfigs();
		} catch (err: any) {
			error = err.message || 'Failed to delete configuration';
		} finally {
			loading = false;
		}
	}

	async function testConnection(config: any) {
		try {
			loading = true;
			const result = await api.testVectorDbConnection(
				data.organization_id,
				data.project._id,
				config._id
			);
			alert(result.test_result.success ? 'Connection successful!' : 'Connection failed!');
		} catch (err: any) {
			alert(`Connection test failed: ${err.message}`);
		} finally {
			loading = false;
		}
	}

	async function setDefaultConfiguration(config: any) {
		try {
			loading = true;
			await api.setDefaultVectorDbConfig(data.organization_id, data.project._id, config._id);
			await loadVectorDbConfigs();
		} catch (err: any) {
			error = err.message || 'Failed to set default configuration';
		} finally {
			loading = false;
		}
	}

	function getProviderSchema(providerId: string) {
		return supportedProviders.find((p) => p.id === providerId)?.config_schema || {};
	}

	function addDocument() {
		uploadForm.documents = [
			...uploadForm.documents,
			JSON.stringify({
				id: `doc_${Date.now()}`,
				title: "New Document",
				content: "Document content goes here...",
			}, null, 2)
		];
	}

	function clearAllDocuments() {
		uploadForm.documents = [
			JSON.stringify({
				id: `doc_${Date.now()}`,
				title: "New Document",
				content: "Document content goes here...",
			}, null, 2)
		];
	}

	function removeDocument(index: number) {
		uploadForm.documents = uploadForm.documents.filter((_, i) => i !== index);
	}

	function handleDocumentJsonChange(index: number, event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		const jsonString = textarea.value;
		
		try {
			// Validate JSON syntax
			JSON.parse(jsonString);
			
			// Update the document at the specific index
			uploadForm.documents[index] = jsonString;
			
			// Clear any error
			error = '';
		} catch (err) {
			// Don't update the array if JSON is invalid, but don't show error yet
			// This allows user to type without constant error messages
		}
	}

	function handleJsonFileUpload() {
		jsonFileInput.click();
	}

	function onJsonFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		if (!file.name.endsWith('.json')) {
			error = 'Please select a JSON file';
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const jsonContent = JSON.parse(e.target?.result as string);

				// Handle flexible JSON structure
				let documentsArray: any[];
				let apiKeyId = '';

				// Check if it's the new format with documents array and api_key_id
				if (jsonContent.documents && Array.isArray(jsonContent.documents)) {
					documentsArray = jsonContent.documents;
					apiKeyId = jsonContent.api_key_id || '';
				} 
				// Legacy format: direct array of documents
				else if (Array.isArray(jsonContent)) {
					documentsArray = jsonContent;
				} else {
					throw new Error('JSON file must contain either an array of documents or an object with a "documents" array');
				}

				// Store documents as JSON strings for editing
				// Each document maintains its original flexible structure
				const validDocuments = documentsArray.map((doc, index) => {
					// Ensure each document is an object
					if (typeof doc !== 'object' || doc === null) {
						throw new Error(`Document at index ${index} must be a JSON object`);
					}

					// Keep the original structure completely intact
					// Add an id only if it doesn't exist
					const documentWithId = {
						...doc,
						id: doc.id || `doc_${Date.now()}_${index}`
					};

					// Return as formatted JSON string for editing
					return JSON.stringify(documentWithId, null, 2);
				});

				// Replace current documents with the ones from JSON
				uploadForm.documents = validDocuments;
				
				// Set the API key if provided
				if (apiKeyId) {
					uploadForm.api_key_id = apiKeyId;
				}
				
				error = '';

				// Reset file input
				input.value = '';
			} catch (err: any) {
				error = `Invalid JSON file: ${err.message}`;
			}
		};

		reader.onerror = () => {
			error = 'Failed to read the JSON file';
		};

		reader.readAsText(file);
	}

	async function uploadDocuments() {
		try {
			loading = true;
			error = '';

			// Parse JSON strings back to objects and validate
			const parsedDocuments = [];
			for (let i = 0; i < uploadForm.documents.length; i++) {
				const docString = uploadForm.documents[i];
				if (typeof docString !== 'string' || docString.trim() === '') {
					continue; // Skip empty documents
				}

				try {
					const parsedDoc = JSON.parse(docString);
					if (typeof parsedDoc !== 'object' || parsedDoc === null) {
						throw new Error(`Document ${i + 1}: Must be a JSON object`);
					}
					parsedDocuments.push(parsedDoc);
				} catch (parseError) {
					throw new Error(`Document ${i + 1}: Invalid JSON - ${parseError.message}`);
				}
			}

			if (parsedDocuments.length === 0) {
				throw new Error('Please add at least one valid document');
			}

			// Use provided API key or fallback to project's first API key
			const apiKeyId = uploadForm.api_key_id || (data.project as any).apiKeys?.[0]?._id;
			if (!apiKeyId) {
				throw new Error('No API key configured. Please provide an api_key_id or configure one for this project');
			}

			const documentsData = {
				documents: parsedDocuments,
				api_key_id: apiKeyId
			};

			const result = await api.indexDocuments(
				data.organization_id, 
				data.project._id, 
				documentsData,
				processInBackground
			);

			if (result.background_processing) {
				// Background processing - show job started message
				showUploadForm = false;
				
				// Add job to active jobs and start polling
				const job = {
					job_id: result.job_id,
					type: 'single',
					status: 'pending',
					progress: {
						total_documents: result.document_count || parsedDocuments.length,
						processed_documents: 0,
						successful_documents: 0,
						failed_documents: 0,
						indexed_chunks: 0
					},
					createdAt: new Date().toISOString()
				};
				
				activeJobs = [job, ...activeJobs];
				startJobPolling(result.job_id);
				
				// Reset form
				uploadForm.documents = [
					JSON.stringify({
						id: `doc_${Date.now()}`,
						title: "Example Document",
						content: "Your document content goes here...",
					}, null, 2)
				];
				uploadForm.api_key_id = '';
			} else {
				// Synchronous processing - traditional handling
				await loadRagStats();
				
				// Reset form
				uploadForm.documents = [
					JSON.stringify({
						id: `doc_${Date.now()}`,
						title: "Example Document",
						content: "Your document content goes here...",
					}, null, 2)
				];
				uploadForm.api_key_id = '';
				showUploadForm = false;
			}
		} catch (err: any) {
			error = err.message || 'Failed to upload documents';
		} finally {
			loading = false;
		}
	}

	async function clearKnowledgeBase() {
		if (
			!confirm(
				'Are you sure you want to clear all documents from the knowledge base? This action cannot be undone.'
			)
		) {
			return;
		}

		try {
			loading = true;
			await api.clearRagKnowledgeBase(data.organization_id, data.project._id);
			await loadRagStats();
		} catch (err: any) {
			error = err.message || 'Failed to clear knowledge base';
		} finally {
			loading = false;
		}
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<!-- MODAL -->
	<div class="mx-4 w-full max-w-6xl rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="border-b border-gray-800 p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-red-500"
					>
						<i class="fas fa-database text-white"></i>
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">RAG Configuration</h2>
						<p class="text-sm text-gray-400">
							Configure vector databases and manage knowledge base
						</p>
					</div>
				</div>
				<button
					on:click={() => dispatch('close')}
					class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>

			<!-- Tabs -->
			<div class="mt-6 flex space-x-1 rounded-lg bg-gray-800 p-1">
				<button
					on:click={() => (activeTab = 'configurations')}
					class="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
					'configurations'
						? 'bg-gray-700 text-white'
						: 'text-gray-400 hover:text-gray-300'}"
				>
					<i class="fas fa-server"></i>
					<span>Vector Databases</span>
				</button>
				<button
					on:click={() => (activeTab = 'documents')}
					class="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
					'documents'
						? 'bg-gray-700 text-white'
						: 'text-gray-400 hover:text-gray-300'}"
				>
					<i class="fas fa-file-text"></i>
					<span>Documents</span>
				</button>
				<button
					on:click={() => (activeTab = 'stats')}
					class="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
					'stats'
						? 'bg-gray-700 text-white'
						: 'text-gray-400 hover:text-gray-300'}"
				>
					<i class="fas fa-chart-bar"></i>
					<span>Statistics</span>
				</button>
				<button
					on:click={() => (activeTab = 'jobs')}
					class="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
					'jobs'
						? 'bg-gray-700 text-white'
						: 'text-gray-400 hover:text-gray-300'}"
				>
					<i class="fas fa-tasks"></i>
					<span>Jobs {#if activeJobs.length > 0}<span class="ml-1 rounded-full bg-orange-500 px-2 py-1 text-xs">{activeJobs.length}</span>{/if}</span>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="max-h-[70vh] overflow-y-auto p-6">
			{#if activeTab === 'configurations'}
				<!-- Vector Database Configurations Tab -->
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-100">Vector Database Configurations</h3>
						<button
							on:click={openCreateConfigForm}
							disabled={loading}
							class="inline-flex items-center space-x-2 rounded-lg bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
						>
							<i class="fas fa-plus"></i>
							<span>Add Configuration</span>
						</button>
					</div>

					{#if vectorDbConfigs.length === 0}
						<div class="py-12 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10"
							>
								<i class="fas fa-database text-2xl text-orange-400"></i>
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-200">No Vector Database Configured</h3>
							<p class="mb-4 text-gray-400">
								Configure a vector database to enable RAG search capabilities for your agents.
							</p>
							<button
								on:click={openCreateConfigForm}
								class="inline-flex items-center space-x-2 rounded-lg bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
							>
								<i class="fas fa-plus"></i>
								<span>Add Your First Configuration</span>
							</button>
						</div>
					{:else}
						<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{#each vectorDbConfigs as config}
								<div
									class="rounded-lg border border-gray-700 bg-gray-800 p-4 {config.is_default
										? 'ring-2 ring-orange-500'
										: ''}"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center space-x-2">
												<h4 class="font-medium text-gray-100">{config.name}</h4>
												{#if config.is_default}
													<span
														class="inline-flex items-center rounded-full bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-400"
													>
														Default
													</span>
												{/if}
												<div class="flex items-center space-x-1">
													<div
														class="h-2 w-2 rounded-full {config.connection_status?.status ===
														'connected'
															? 'bg-green-400'
															: 'bg-red-400'}"
													></div>
													<span class="text-xs text-gray-400">
														{config.connection_status?.status || 'Unknown'}
													</span>
												</div>
											</div>
											<p class="mt-1 text-sm text-gray-400">
												{config.description || 'No description'}
											</p>
											<div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
												<span>Provider: {config.provider}</span>
												{#if config.usage_stats}
													<span>Documents: {config.usage_stats.total_documents || 0}</span>
												{/if}
											</div>
										</div>
										<div class="flex items-center space-x-2">
											<button
												on:click={() => testConnection(config)}
												disabled={loading}
												class="rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
												title="Test Connection"
											>
												<i class="fas fa-plug text-sm"></i>
											</button>
											<button
												on:click={() => openEditConfigForm(config)}
												disabled={loading}
												class="rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
												title="Edit"
											>
												<i class="fas fa-edit text-sm"></i>
											</button>
											{#if !config.is_default}
												<button
													on:click={() => setDefaultConfiguration(config)}
													disabled={loading}
													class="rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-orange-400"
													title="Set as Default"
												>
													<i class="fas fa-star text-sm"></i>
												</button>
											{/if}
											<button
												on:click={() => deleteConfiguration(config)}
												disabled={loading}
												class="rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-red-400"
												title="Delete"
											>
												<i class="fas fa-trash text-sm"></i>
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if activeTab === 'documents'}
				<!-- Documents Management Tab -->
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-100">Document Management</h3>
						<div class="flex space-x-3">
							<button
								on:click={() => (showUploadForm = true)}
								disabled={loading}
								class="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
							>
								<i class="fas fa-upload"></i>
								<span>Upload Documents</span>
							</button>
							{#if ragStats?.total_documents > 0}
								<button
									on:click={clearKnowledgeBase}
									disabled={loading}
									class="inline-flex items-center space-x-2 rounded-lg border border-red-600 px-4 py-2 text-red-400 transition-colors hover:bg-red-600/10 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
								>
									<i class="fas fa-trash"></i>
									<span>Clear All</span>
								</button>
							{/if}
						</div>
					</div>

					{#if showUploadForm}
						<!-- Upload Form -->
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
							<div class="mb-4 flex items-center justify-between">
								<h4 class="font-medium text-gray-100">Upload Documents to Knowledge Base</h4>
								<button
									on:click={() => (showUploadForm = false)}
									class="rounded p-1.5 text-gray-400 hover:text-gray-300"
								>
									<i class="fas fa-times"></i>
								</button>
							</div>

							<!-- JSON Upload Section -->
							<div class="bg-gray-750 mb-6 rounded-lg border border-gray-600 p-4">
								<div class="flex items-center justify-between">
									<div>
										<h5 class="font-medium text-gray-200">Import from JSON File</h5>
										<p class="mt-1 text-sm text-gray-400">
											Upload a JSON file with flexible document structure. Supports any JSON fields per document.
										</p>
									</div>
									<button
										on:click={handleJsonFileUpload}
										disabled={loading}
										class="inline-flex items-center space-x-2 rounded-lg border border-orange-600 px-4 py-2 text-orange-400 transition-colors hover:bg-orange-600/10 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
									>
										<i class="fas fa-file-upload"></i>
										<span>Import JSON</span>
									</button>
								</div>

								<!-- Example JSON structure -->
								<details class="mt-3">
									<summary class="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
										View expected JSON format
									</summary>
									<pre
										class="mt-2 overflow-x-auto rounded bg-gray-800 p-3 text-xs text-gray-300"><code
											>{`{
  "documents": [
    {
      "id": "doc1",
      "title": "Sample Document", 
      "content": "This is the document content...",
      "url": "https://example.com/doc1",
      "brand": "Example Brand",
      "sentiment": "positive",
      "themes": ["technology", "innovation"],
      "metadata": {"author": "John Doe"},
      "custom_field": "Any additional data you need"
    }
  ],
  "api_key_id": "your-api-key-uuid-here"
}`}</code
										></pre>
								</details>
							</div>

							<!-- API Key Section -->
							<div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-1">
								<div>
									<label class="mb-2 block text-sm font-medium text-gray-300">
										API Key ID
									</label>
									<input
										type="text"
										bind:value={uploadForm.api_key_id}
										placeholder="Leave empty to use project's default API key"
										class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
									/>
									<p class="mt-1 text-xs text-gray-400">
										Optional: Specify an API key ID. If not provided, will use the project's default API key.
									</p>
								</div>
							</div>

							<!-- Processing Mode Toggle -->
							<div class="mb-6 rounded-lg border border-gray-600 bg-gray-750 p-4">
								<div class="flex items-center justify-between">
									<div>
										<h5 class="font-medium text-gray-200">Processing Mode</h5>
										<p class="mt-1 text-sm text-gray-400">
											{processInBackground 
												? 'Documents will be processed in the background. You can monitor progress in the Jobs tab.'
												: 'Documents will be processed synchronously. The upload will wait until indexing is complete.'
											}
										</p>
									</div>
									<label class="flex cursor-pointer items-center">
										<input
											type="checkbox"
											bind:checked={processInBackground}
											class="sr-only"
										/>
										<div class="relative">
											<div class="block h-6 w-10 rounded-full {processInBackground ? 'bg-orange-600' : 'bg-gray-600'}"></div>
											<div class="dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition transform {processInBackground ? 'translate-x-4' : ''}"></div>
										</div>
									</label>
								</div>
							</div>

							<!-- Hidden file input -->
							<input
								type="file"
								accept=".json"
								bind:this={jsonFileInput}
								on:change={onJsonFileSelected}
								class="hidden"
							/>

							<div class="space-y-4">
								{#each uploadForm.documents as document, index}
									<div class="space-y-4 rounded border border-gray-600 p-4">
										<div class="flex items-center justify-between">
											<h5 class="font-medium text-gray-300">Document {index + 1}</h5>
											{#if uploadForm.documents.length > 1}
												<button
													on:click={() => removeDocument(index)}
													class="text-red-400 hover:text-red-300"
													aria-label="Remove document"
												>
													<i class="fas fa-trash text-sm"></i>
												</button>
											{/if}
										</div>

										<div>
											<label class="mb-2 block text-sm font-medium text-gray-300">
												Document JSON Structure
											</label>
											<textarea
												bind:value={document}
												placeholder={JSON.stringify({
													"id": "unique-document-id", 
													"title": "Document Title",
													"content": "Your document content...",
													"custom_field": "Any custom data you need"
												}, null, 2)}
												rows="12"
												class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
												on:input={(e) => handleDocumentJsonChange(index, e)}
											></textarea>
											<p class="mt-1 text-xs text-gray-400">
												Enter any JSON structure for this document. The structure is completely flexible - add any fields you need.
											</p>
										</div>
									</div>
								{/each}

								<div class="flex items-center justify-between">
									<div class="flex space-x-3">
										<button
											on:click={addDocument}
											class="inline-flex items-center space-x-2 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
										>
											<i class="fas fa-plus"></i>
											<span>Add Another Document</span>
										</button>

										{#if uploadForm.documents.length > 1}
											<button
												on:click={clearAllDocuments}
												class="inline-flex items-center space-x-2 rounded-lg border border-red-600 px-4 py-2 text-red-400 transition-colors hover:bg-red-600/10"
											>
												<i class="fas fa-trash-alt"></i>
												<span>Clear All</span>
											</button>
										{/if}
									</div>

									<div class="flex space-x-3">
										<button
											on:click={() => (showUploadForm = false)}
											disabled={loading}
											class="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
										>
											Cancel
										</button>
										<button
											on:click={uploadDocuments}
											disabled={loading}
											class="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
										>
											{#if loading}
												<i class="fas fa-spinner fa-spin"></i>
												<span>Uploading...</span>
											{:else}
												<i class="fas fa-upload"></i>
												<span>Upload Documents</span>
											{/if}
										</button>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Documents Overview -->
					{#if ragStats}
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
							<h4 class="mb-4 font-medium text-gray-100">Knowledge Base Overview</h4>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<div class="text-center">
									<div class="text-2xl font-bold text-blue-400">
										{ragStats.total_documents || 0}
									</div>
									<div class="text-sm text-gray-400">Total Documents</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-green-400">
										{ragStats.total_searches || 0}
									</div>
									<div class="text-sm text-gray-400">Total Searches</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-yellow-400">
										{ragStats.avg_search_time || 0}ms
									</div>
									<div class="text-sm text-gray-400">Avg Search Time</div>
								</div>
								<div class="text-center">
									<div class="text-2xl font-bold text-purple-400">
										{ragStats.vector_database?.status || 'Unknown'}
									</div>
									<div class="text-sm text-gray-400">DB Status</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'stats'}
				<!-- Statistics Tab -->
				<div class="space-y-6">
					<h3 class="text-lg font-semibold text-gray-100">RAG Statistics</h3>

					{#if ragStats}
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<!-- Usage Stats -->
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
								<h4 class="mb-4 font-medium text-gray-100">Usage Statistics</h4>
								<div class="space-y-3">
									<div class="flex justify-between">
										<span class="text-gray-400">Total Documents:</span>
										<span class="font-medium text-gray-100">{ragStats.total_documents || 0}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-400">Total Searches:</span>
										<span class="font-medium text-gray-100">{ragStats.total_searches || 0}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-400">Average Search Time:</span>
										<span class="font-medium text-gray-100">{ragStats.avg_search_time || 0}ms</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-400">Last Indexed:</span>
										<span class="font-medium text-gray-100">
											{ragStats.last_indexed
												? new Date(ragStats.last_indexed).toLocaleString()
												: 'Never'}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-400">Last Searched:</span>
										<span class="font-medium text-gray-100">
											{ragStats.last_searched
												? new Date(ragStats.last_searched).toLocaleString()
												: 'Never'}
										</span>
									</div>
								</div>
							</div>

							<!-- Vector Database Info -->
							{#if ragStats.vector_database}
								<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
									<h4 class="mb-4 font-medium text-gray-100">Vector Database</h4>
									<div class="space-y-3">
										<div class="flex justify-between">
											<span class="text-gray-400">Provider:</span>
											<span class="font-medium text-gray-100">
												{ragStats.vector_database.provider || 'Unknown'}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-400">Status:</span>
											<span
												class="font-medium {ragStats.vector_database.status === 'connected'
													? 'text-green-400'
													: 'text-red-400'}"
											>
												{ragStats.vector_database.status || 'Unknown'}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-400">Total Documents:</span>
											<span class="font-medium text-gray-100">
												{ragStats.vector_database.total_documents || 0}
											</span>
										</div>
									</div>

									{#if ragStats.vector_database.brands?.length > 0}
										<div class="mt-4">
											<span class="text-sm text-gray-400">Brands:</span>
											<div class="mt-2 flex flex-wrap gap-2">
												{#each ragStats.vector_database.brands as brand}
													<span class="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
														{brand}
													</span>
												{/each}
											</div>
										</div>
									{/if}

									{#if ragStats.vector_database.themes?.length > 0}
										<div class="mt-4">
											<span class="text-sm text-gray-400">Themes:</span>
											<div class="mt-2 flex flex-wrap gap-2">
												{#each ragStats.vector_database.themes as theme}
													<span class="rounded bg-green-500/20 px-2 py-1 text-xs text-green-400">
														{theme}
													</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{:else}
						<div class="py-12 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-700"
							>
								<i class="fas fa-chart-bar text-2xl text-gray-400"></i>
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-200">No Statistics Available</h3>
							<p class="text-gray-400">
								Upload some documents and perform searches to see RAG statistics.
							</p>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'jobs'}
				<!-- Background Jobs Tab -->
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-100">Background Indexing Jobs</h3>
						<button
							on:click={() => loadJobData()}
							disabled={loading}
							class="inline-flex items-center space-x-2 rounded-lg border border-gray-600 px-4 py-2 text-gray-400 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
						>
							<i class="fas fa-sync-alt"></i>
							<span>Refresh</span>
						</button>
					</div>

					<!-- Active Jobs -->
					{#if activeJobs.length > 0}
						<div class="space-y-4">
							<h4 class="font-medium text-gray-200">Active Jobs ({activeJobs.length})</h4>
							{#each activeJobs as job}
								<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-3">
											<div class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
												<i class="fas fa-cog animate-spin text-orange-400"></i>
											</div>
											<div>
												<div class="font-medium text-gray-100">
													{job.type === 'single' ? 'Document Indexing' : 'Batch Indexing'}
												</div>
												<div class="text-sm text-gray-400">
													Job ID: {job.job_id}
												</div>
											</div>
										</div>
										<div class="flex items-center space-x-3">
											<div class="text-right">
												<div class="text-sm font-medium text-gray-200">
													{job.status === 'pending' ? 'Pending' : 'Processing'}
												</div>
												<div class="text-xs text-gray-400">
													{job.progress ? `${job.progress.processed_documents}/${job.progress.total_documents} docs` : 'Starting...'}
												</div>
											</div>
											<button
												on:click={() => cancelJob(job.job_id)}
												class="rounded p-2 text-gray-400 hover:bg-red-600/20 hover:text-red-400 focus:outline-none"
												title="Cancel Job"
											>
												<i class="fas fa-times"></i>
											</button>
										</div>
									</div>

									{#if job.progress && job.progress.total_documents > 0}
										<div class="mt-4">
											<div class="mb-2 flex justify-between text-sm">
												<span class="text-gray-400">Progress</span>
												<span class="text-gray-300">
													{Math.round((job.progress.processed_documents / job.progress.total_documents) * 100)}%
												</span>
											</div>
											<div class="h-2 rounded-full bg-gray-700">
												<div
													class="h-2 rounded-full bg-orange-500 transition-all duration-300"
													style="width: {(job.progress.processed_documents / job.progress.total_documents) * 100}%"
												></div>
											</div>
											<div class="mt-2 flex justify-between text-xs text-gray-400">
												<span>
													{job.progress.successful_documents} successful, {job.progress.failed_documents} failed
												</span>
												<span>
													{job.progress.indexed_chunks} chunks indexed
												</span>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<!-- Job History -->
					<div class="space-y-4">
						<h4 class="font-medium text-gray-200">Job History</h4>
						
						{#if jobHistory.length === 0}
							<div class="py-8 text-center">
								<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-700">
									<i class="fas fa-history text-2xl text-gray-400"></i>
								</div>
								<h5 class="mb-2 text-lg font-medium text-gray-200">No Jobs Found</h5>
								<p class="text-gray-400">
									Background indexing jobs will appear here once you start uploading documents.
								</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each jobHistory.slice(0, 10) as job}
									<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-3">
												<div class="flex h-8 w-8 items-center justify-center rounded-full {
													job.status === 'completed' ? 'bg-green-500/20' :
													job.status === 'failed' ? 'bg-red-500/20' :
													job.status === 'processing' ? 'bg-orange-500/20' :
													'bg-gray-500/20'
												}">
													<i class="fas {
														job.status === 'completed' ? 'fa-check text-green-400' :
														job.status === 'failed' ? 'fa-times text-red-400' :
														job.status === 'processing' ? 'fa-cog animate-spin text-orange-400' :
														'fa-clock text-gray-400'
													}"></i>
												</div>
												<div>
													<div class="font-medium text-gray-100">
														{job.type === 'single' ? 'Document Indexing' : 'Batch Indexing'}
													</div>
													<div class="text-sm text-gray-400">
														{new Date(job.createdAt).toLocaleString()}
													</div>
												</div>
											</div>
											<div class="text-right">
												<div class="text-sm font-medium {
													job.status === 'completed' ? 'text-green-400' :
													job.status === 'failed' ? 'text-red-400' :
													job.status === 'processing' ? 'text-orange-400' :
													'text-gray-400'
												}">
													{job.status === 'completed' ? 'Completed' :
													 job.status === 'failed' ? 'Failed' :
													 job.status === 'processing' ? 'Processing' :
													 'Pending'}
												</div>
												{#if job.results && job.status === 'completed'}
													<div class="text-xs text-gray-400">
														{job.results.indexed_count} chunks indexed
													</div>
												{:else if job.error && job.status === 'failed'}
													<div class="text-xs text-red-400" title={job.error}>
														Error occurred
													</div>
												{:else if job.progress}
													<div class="text-xs text-gray-400">
														{job.progress.processed_documents}/{job.progress.total_documents} docs
													</div>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Job Statistics -->
					{#if jobStats && jobStats.length > 0}
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<h4 class="mb-4 font-medium text-gray-100">Job Statistics</h4>
							<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
								{#each jobStats as stat}
									<div>
										<div class="text-sm font-medium text-gray-300 capitalize">{stat._id} Jobs</div>
										<div class="mt-1 text-lg font-bold text-gray-100">{stat.count}</div>
										{#if stat.total_chunks_indexed > 0}
											<div class="text-xs text-gray-400">{stat.total_chunks_indexed} chunks indexed</div>
										{/if}
										{#if stat.total_processing_time > 0}
											<div class="text-xs text-gray-400">
												Avg: {Math.round(stat.total_processing_time / stat.count / 1000)}s
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="sticky bottom-0 border-t border-gray-800 bg-gray-900 p-6">
			{#if error}
				<div class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<div class="flex items-center space-x-2">
						<i class="fas fa-exclamation-circle text-red-400"></i>
						<p class="text-red-400">{error}</p>
					</div>
				</div>
			{/if}

			<div class="flex justify-end space-x-3">
				<button
					type="button"
					on:click={() => dispatch('close')}
					disabled={loading}
					class="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					Close
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Create/Edit Configuration Modal -->
{#if showCreateConfigForm}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
		<div class="mx-4 w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-800 shadow-2xl">
			<div class="border-b border-gray-700 p-6">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-white">
						{editingConfig ? 'Edit' : 'Create'} Vector Database Configuration
					</h3>
					<button
						on:click={closeConfigForm}
						class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-300"
					>
						<i class="fas fa-times"></i>
					</button>
				</div>
			</div>

			<div class="p-6">
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-300">Name *</label>
							<input
								type="text"
								bind:value={configForm.name}
								placeholder="My Vector Database"
								class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
							/>
						</div>
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-300">Provider *</label>
							<select
								bind:value={configForm.provider}
								class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
							>
								<option value="">Select provider...</option>
								{#each supportedProviders as provider}
									<option value={provider.id}>{provider.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300">Description</label>
						<textarea
							bind:value={configForm.description}
							placeholder="Description of this configuration..."
							rows="2"
							class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
						></textarea>
					</div>

					{#if configForm.provider}
						{@const schema = getProviderSchema(configForm.provider)}
						{#if schema && Object.keys(schema).length > 0}
							<div class="space-y-4 rounded-lg border border-gray-600 bg-gray-700 p-4">
								<h4 class="font-medium text-gray-200">Provider Configuration</h4>
								{#each Object.entries(schema) as [key, field]}
									<div>
										<label class="mb-2 block text-sm font-medium text-gray-300">
											{field.description || key}
											{#if field.required}*{/if}
										</label>
										{#if field.type === 'string'}
											<input
												type={key.toLowerCase().includes('password') ||
												key.toLowerCase().includes('key')
													? 'password'
													: 'text'}
												bind:value={configForm.config[key]}
												placeholder={field.default || ''}
												class="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
											/>
										{:else if field.type === 'number'}
											<input
												type="number"
												bind:value={configForm.config[key]}
												placeholder={field.default?.toString() || ''}
												class="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
											/>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					{/if}

					<div class="flex items-center">
						<input
							type="checkbox"
							id="is-default"
							bind:checked={configForm.is_default}
							class="mr-2 h-4 w-4 rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-2 focus:ring-orange-500"
						/>
						<label for="is-default" class="text-sm font-medium text-gray-300">
							Set as default configuration
						</label>
					</div>
				</div>
			</div>

			<div class="border-t border-gray-700 p-6">
				<div class="flex justify-end space-x-3">
					<button
						type="button"
						on:click={closeConfigForm}
						disabled={loading}
						class="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={saveConfiguration}
						disabled={loading || !configForm.name || !configForm.provider}
						class="inline-flex items-center space-x-2 rounded-lg bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<i class="fas fa-spinner fa-spin"></i>
							<span>{editingConfig ? 'Updating...' : 'Creating...'}</span>
						{:else}
							<i class="fas fa-save"></i>
							<span>{editingConfig ? 'Update' : 'Create'}</span>
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
