AgentAPI["Things"] =
{
	"XmppHelper":
	{
		"ConcentratorNamespace": "urn:nf:iot:concentrator:1.0",
		"SensorDataNamespace": "urn:nf:iot:sd:1.0",
		"JidType":
		{
			"Domain": 0,
			"Bare": 1,
			"Full": 2
		},
		"ClassifyJid": function (JID)
		{
			var i = JID.indexOf("@");
			if (i < 0)
				return this.JidType.Domain;

			i = JID.indexOf("/", i);
			if (i < 0)
				return this.JidType.Bare;
			else
				return this.JidType.Full;
		},
		"GetFullJid": async function (JID, LogWarning)
		{
			if (this.ClassifyJid(JID) == this.JidType.Bare)
			{
				if (LogWarning)
					console.warn("Function called with Bare JID instead of Full JID. Call AgentAPI.Things.XmppHelper.GetFullJid before, to minimize the number of calls to the broker.");

				var Presence = await AgentAPI.Xmpp.PresenceProbe(JID);
				if (Presence.jid && this.ClassifyJid(Presence.jid) === this.JidType.Full)
					return Presence.jid;
			}

			return JID;
		},
		"AssertResponseOk": function (Response)
		{
			if (!Response.ok)
			{
				if (Response.ErrorElement)
				{
					if (Response.ErrorElement.text)
						throw new Error(Response.ErrorElement.text.value);

					for (const Name of Object.keys(Response.ErrorElement))
					{
						if (!Name.startsWith("__") && Name !== "type")
							throw new Error(Name);
					}
				}

				throw new Error("Request failed.");
			}
		},
		"EscapeAttributeValue": function (s)
		{
			return s.
				replace(/&/g, '&amp;').
				replace(/</g, '&lt;').
				replace(/>/g, '&gt;').
				replace(/"/g, '&quot;').
				replace(/'/g, '&apos;').
				replace(/\r/g, '&#13;').
				replace(/\n/g, '&#10;').
				replace(/\t/g, '&#9;');
		},
		"PadZeroes": function (Nr, Number)
		{
			return String(Number).padStart(Nr, '0');
		},
		"ToXmlDateTime": function (Timestamp)
		{
			const TimezoneOffset = -Timestamp.getTimezoneOffset();

			return this.PadZeroes(4, Timestamp.getFullYear()) + "-" +
				this.PadZeroes(2, Timestamp.getMonth() + 1) + "-" +
				this.PadZeroes(2, Timestamp.getDate()) + "T" +
				this.PadZeroes(2, Timestamp.getHours()) + ":" +
				this.PadZeroes(2, Timestamp.getMinutes()) + ":" +
				this.PadZeroes(2, Timestamp.getSeconds()) + "." +
				this.PadZeroes(3, Timestamp.getMilliseconds()) +
				(TimezoneOffset >= 0 ? '+' : '-') +
				this.PadZeroes(2, Math.floor(Math.abs(TimezoneOffset) / 60)) + ":" +
				this.PadZeroes(2, Math.abs(TimezoneOffset) % 60);
		},
		"AddLanguageAttribute": function (Query, Language)
		{
			if (Language)
				Query += " xml:lang='" + this.EscapeAttributeValue(Language) + "'";

			return Query;
		},
		"AddTokenAttributes": function (Query, DeviceToken, ServiceToken, UserToken)
		{
			if (DeviceToken)
				Query += " dt='" + this.EscapeAttributeValue(DeviceToken) + "'";

			if (ServiceToken)
				Query += " st='" + this.EscapeAttributeValue(ServiceToken) + "'";

			if (UserToken)
				Query += " ut='" + this.EscapeAttributeValue(UserToken) + "'";

			return Query;
		},
		"AddSourceReferenceAttributes": function (Query, SourceId)
		{
			if (SourceId)
				Query += " src='" + this.EscapeAttributeValue(SourceId) + "'";

			return Query;
		},
		"AddNodeReferenceAttributes": function (Query, NodeId, SourceId, Partition)
		{
			if (NodeId)
				Query += " id='" + this.EscapeAttributeValue(NodeId) + "'";

			Query = this.AddSourceReferenceAttributes(Query, SourceId);

			if (Partition)
				Query += " pt='" + this.EscapeAttributeValue(Partition) + "'";

			return Query;
		},
		"AddParametersAttributes": function (Query, Parameters, Messages)
		{
			if (Parameters)
				Query += " parameters='true'";

			if (Messages)
				Query += " messages='true'";

			return Query;
		},
		"AddFieldTypeAttributes": function (Query, Momentary, Peak, Status, Computed, Identity, History)
		{
			if (Momentary && Peak && Status && Computed && Identity && History)
				Query += " all='true'";
			else
			{
				if (Momentary)
					Query += " m='true'";

				if (Peak)
					Query += " p='true'";

				if (Status)
					Query += " s='true'";

				if (Computed)
					Query += " c='true'";

				if (Identity)
					Query += " i='true'";

				if (History)
					Query += " h='true'";
			}

			return Query;
		},
		"AddFields": function (Query, Fields)
		{
			if (Fields)
			{
				var i, c = Fields.length;

				for (i = 0; i < c; i++)
				{
					var Field = Fields[i];
					if (Field)
						Query += "<f n='" + this.EscapeAttributeValue(Fields[i]) + "'/>";
				}
			}

			return Query;
		},
		"AddTimingAttributes": function (Query, From, To, When)
		{
			if (From)
				Query += " from='" + AgentAPI.Things.XmppHelper.ToXmlDateTime(From) + "'";

			if (To)
				Query += " to='" + AgentAPI.Things.XmppHelper.ToXmlDateTime(To) + "'";

			if (When)
				Query += " when='" + AgentAPI.Things.XmppHelper.ToXmlDateTime(When) + "'";

			return Query;
		},
		"AddCommandReferenceAttributes": function (Query, Command, QueryId)
		{
			if (Command)
				Query += " command='" + this.EscapeAttributeValue(Command) + "'";

			if (QueryId)
				Query += " queryId='" + this.EscapeAttributeValue(QueryId) + "'";

			return Query;
		},
		"TokenInformationQuery": async function (Name, Type, JID, Language, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += "/>";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		},
		"SourceReferenceQuery": async function (Name, Type, JID, Language, SourceId, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddSourceReferenceAttributes(Query, SourceId);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += "/>";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		},
		"NodeReferenceQuery": async function (Name, Type, JID, Language, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddNodeReferenceAttributes(Query, NodeId, SourceId, Partition);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += "/>";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		},
		"SourceParameterReferenceQuery": async function (Name, Type, JID, Language, Parameters, Messages, SourceId, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddParametersAttributes(Query, Parameters, Messages);
			Query = this.AddSourceReferenceAttributes(Query, SourceId);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += "/>";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query, Language);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		},
		"AddOnlyIfDerivedFrom": function (Query, OnlyIfDerivedFrom)
		{
			if (OnlyIfDerivedFrom)
			{
				if (OnlyIfDerivedFrom.length)
				{
					var i, c = OnlyIfDerivedFrom.length;

					for (i = 0; i < c; i++)
						Query = this.AddOnlyIfDerivedFrom(Query, OnlyIfDerivedFrom[i]);
				}
				else
				{
					Query += "<onlyIfDerivedFrom>" +
						this.EscapeAttributeValue(OnlyIfDerivedFrom) +
						"</onlyIfDerivedFrom>";
				}
			}

			return Query;
		},
		"SourceParameterTypesReferenceQuery": async function (Name, Type, JID, Language, Parameters, Messages, SourceId, OnlyIfDerivedFrom, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddParametersAttributes(Query, Parameters, Messages);
			Query = this.AddSourceReferenceAttributes(Query, SourceId);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += ">";
			Query = this.AddOnlyIfDerivedFrom(Query, OnlyIfDerivedFrom);
			Query += "</" + Name + ">";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query, Language);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		},
		"NodeParameterReferenceQuery": async function (Name, Type, JID, Language, Parameters, Messages, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddParametersAttributes(Query, Parameters, Messages);
			Query = this.AddNodeReferenceAttributes(Query, NodeId, SourceId, Partition);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += "/>";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query, Language);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		},
		"NodeCommandReferenceQuery": async function (Name, Type, JID, Language, Command, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddNodeReferenceAttributes(Query, NodeId, SourceId, Partition);
			Query = this.AddCommandReferenceAttributes(Query, Command, null);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += "/>";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		},
		"NodeCommandXReferenceQuery": async function (Name, Type, JID, Language, Command, QueryId, Parameters, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Query = "<" + Name + " xmlns='" + this.ConcentratorNamespace + "'";
			Query = this.AddLanguageAttribute(Query, Language);
			Query = this.AddNodeReferenceAttributes(Query, NodeId, SourceId, Partition);
			Query = this.AddCommandReferenceAttributes(Query, Command, QueryId);
			Query = this.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += "><x xmlns='jabber:x:data' type='submit'>";

			var i, c = Parameters.field.length;

			for (i = 0; i < c; i++)
			{
				Query += "<field type='" + this.EscapeAttributeValue(Parameters.field[i].type);
				Query += "' var='" + this.EscapeAttributeValue(Parameters.field[i].var);
				Query += "'>";

				if (Parameters.field[i].value && Parameters.field[i].value.value)
				{
					Query +=
						"<value>" +
						this.EscapeAttributeValue(Parameters.field[i].value.value) +
						"</value>";
				}

				Query += "</field>";
			}

			Query += "</x></" + Name + ">";

			JID = await this.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, Type, Query);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			return Response;
		}
	},
	"Concentrator":
	{
		"GetCapabilities": async function (JID, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.TokenInformationQuery(
				"getCapabilities", "get", JID, null, DeviceToken, ServiceToken, UserToken);

			var Strings = Response.Stanza.strings.value;
			var i, c = Strings.length;
			var Result = {};

			for (i = 0; i < c; i++)
				Result[Strings[i].value] = true;

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"GetAllDataSources": async function (JID, Language, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.TokenInformationQuery(
				"getAllDataSources", "get", JID, Language, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.dataSources.dataSource;

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"GetRootDataSources": async function (JID, Language, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.TokenInformationQuery(
				"getRootDataSources", "get", JID, Language, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.dataSources.dataSource;

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"GetChildDataSources": async function (JID, Language, SourceId, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.SourceReferenceQuery(
				"getChildDataSources", "get", JID, Language, SourceId, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.dataSources.dataSource;
			if (!Result)
				Result = new Array(0);

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"ContainsNode": async function (JID, Language, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.NodeReferenceQuery(
				"containsNode", "get", JID, Language, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.bool.value === "true";

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		// TODO: containsNodes
		"GetNode": async function (JID, Language, Parameters, Messages, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.NodeParameterReferenceQuery(
				"getNode", "get", JID, Language, Parameters, Messages, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.nodeInfo;

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		// TODO: getNodes
		"GetAllNodes": async function (JID, Language, Parameters, Messages, SourceId, OnlyIfDerivedFrom, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.SourceParameterTypesReferenceQuery(
				"getAllNodes", "get", JID, Language, Parameters, Messages, SourceId, OnlyIfDerivedFrom, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.nodeInfos.nodeInfo;
			if (!Result)
				Result = new Array(0);

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		// TODO: getNodeInheritence
		"GetRootNodes": async function (JID, Language, Parameters, Messages, SourceId, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.SourceParameterReferenceQuery(
				"getRootNodes", "get", JID, Language, Parameters, Messages, SourceId, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.nodeInfos.nodeInfo;
			if (!Result)
				Result = new Array(0);

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"GetChildNodes": async function (JID, Language, Parameters, Messages, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.NodeParameterReferenceQuery(
				"getChildNodes", "get", JID, Language, Parameters, Messages, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.nodeInfos.nodeInfo;
			if (!Result)
				Result = new Array(0);

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		// TODO: getAncestors
		// TODO: getNodeParametersForEdit
		// TODO: setNodeParametersAfterEdit
		// TODO: getCommonNodeParametersForEdit
		// TODO: setCommonNodeParametersAfterEdit
		// TODO: getAddableNodeTypes
		// TODO: getParametersForNewNode
		// TODO: createNewNode
		// TODO: destroyNode
		// TODO: moveNodeUp
		// TODO: moveNodeDown
		// TODO: moveNodesUp
		// TODO: moveNodesDown
		// TODO: subscribe
		// TODO: unsubscribe
		"GetNodeCommands": async function (JID, Language, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.NodeReferenceQuery(
				"getNodeCommands", "get", JID, Language, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.commands;
			if (!Result)
				Result = new Array(0);

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"GetCommandParameters": async function (JID, Language, Command, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Response = await AgentAPI.Things.XmppHelper.NodeCommandReferenceQuery(
				"getCommandParameters", "get", JID, Language, Command, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			var Result = Response.Stanza.x;
			if (!Result)
				Result = new Array(0);

			AgentAPI.IO.AfterResponse(Result);
			return Result;
		},
		"ExecuteSimpleCommand": async function (JID, Language, Command, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			await AgentAPI.Things.XmppHelper.NodeCommandReferenceQuery(
				"executeNodeCommand", "set", JID, Language, Command, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			AgentAPI.IO.AfterResponse("");
		},
		"ExecuteParametrizedCommand": async function (JID, Language, Command, Parameters, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			await AgentAPI.Things.XmppHelper.NodeCommandXReferenceQuery(
				"executeNodeCommand", "set", JID, Language, Command, null, Parameters,
				NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			AgentAPI.IO.AfterResponse("");
		},
		"StartExecuteQuery": async function (JID, Language, Command, QueryId, Parameters, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			if (!QueryId)
				QueryId = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));

			var QueryRecord =
			{
				"Sections": [],
				"Objects": [],
				"Tables": {},
				"Ok": true,
				"Errors": [],
				"HasErrors": false,
				"Started": false,
				"Done": false,
				"Title": "",
				"Status": "",
				"CurrentSection": null,
				"resolve": null
			};

			QueryRecord["Task"] = new Promise((resolve, reject) =>
			{
				QueryRecord["resolve"] = resolve;
				QueryRecord["reject"] = reject;
			});

			this.QueryProgress.Queries[QueryId] = QueryRecord;

			if (!this.QueryProgress.EventHandlersRegistered)
			{
				await AgentAPI.Xmpp.RegisterEventHandler("queryProgress", AgentAPI.Things.XmppHelper.ConcentratorNamespace,
					"", "AgentAPI.Things.Concentrator.QueryProgress.OnQueryProgress");

				this.QueryProgress.EventHandlersRegistered = true;
			}

			await AgentAPI.Things.XmppHelper.NodeCommandXReferenceQuery(
				"executeNodeQuery", "set", JID, Language, Command, QueryId, Parameters,
				NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			AgentAPI.IO.AfterResponse(QueryRecord);

			return QueryRecord;
		},
		"ExecuteQuery": async function (JID, Language, Command, Parameters, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var QueryId = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));

			var QueryRecord = await this.StartExecuteQuery(JID, Language, Command, QueryId,
				Parameters, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken);

			await QueryRecord.Task;

			delete QueryRecord.Task;
			delete QueryRecord.resolve;
			delete QueryRecord.reject;
			delete QueryRecord.CurrentSection;

			AgentAPI.IO.AfterResponse(QueryRecord);

			return QueryRecord;
		},
		"QueryProgress":
		{
			"Queries": {},
			"EventHandlersRegistered": false,
			"OnQueryProgress": function (Data)
			{
				var QueryId = Data.queryId;
				var QueryRecord = this.Queries[QueryId];
				if (!QueryRecord)
				{
					console.warn("Query data event not recognized. Ignored.");
					return;
				}

				var Name;
				var i, c;

				if (Data.queryStarted)
				{
					console.log("Query started.");
					QueryRecord.Started = true;
				}
				else if (Data.title)
				{
					Name = Data.title.name;
					QueryRecord.Title = Name;
					console.log("Title: " + Name);
				}
				else if (Data.beginSection)
				{
					Name = Data.beginSection.header;
					var Section =
					{
						"Type": "Section",
						"Header": Name,
						"Parent": QueryRecord.CurrentSection,
						"Items": []
					};

					if (QueryRecord.CurrentSection)
						QueryRecord.CurrentSection.Items.push(Section);
					else
						QueryRecord.Sections.push(Section);

					QueryRecord.CurrentSection = Section;

					console.log("New section: " + Name);
				}
				else if (Data.endSection)
				{
					console.log("Section completed: " + QueryRecord.CurrentSection.Header);

					var Parent = QueryRecord.CurrentSection.Parent;
					delete QueryRecord.CurrentSection.Parent;
					QueryRecord.CurrentSection = Parent;
				}
				else if (Data.status)
				{
					Name = Data.status.message;
					QueryRecord.Status = Name;
					console.log("Status: " + Name);
				}
				else if (Data.newObject)
				{
					var Object =
					{
						"Type": "Object",
						"ContentType": Data.newObject.contentType,
						"Base64": Data.newObject.value
					};

					QueryRecord.Objects.push(Object);
					QueryRecord.CurrentSection.Items.push(Object);

					console.log("Object received of type: " + Object.ContentType);
				}
				else if (Data.newTable)
				{
					var Table =
					{
						"Type": "Table",
						"Id": Data.newTable.tableId,
						"Name": Data.newTable.tableName,
						"Columns": [],
						"Records": [],
						"Done": false
					};

					QueryRecord.Tables[Table.Id] = Table;
					QueryRecord.CurrentSection.Items.push(Table);

					for (i = 0, c = Data.newTable.column.length; i < c; i++)
					{
						var Column0 = Data.newTable.column[i];
						var Column =
						{
							"Id": Column0.columnId
						};

						if (Column0.header)
							Column.Header = Column0.header;

						if (Column0.src)
							Column.SourceId = Column0.src;

						if (Column0.pt)
							Column.Partition = Column0.pt;

						if (Column0.fgColor)
							Column.ForegroundColor = Column0.fgColor;

						if (Column0.bgColor)
							Column.BackgroundColor = Column0.bgColor;

						if (Column0.alignment)
							Column.Alignment = Column0.alignment;

						if (Column0.nrDecimals)
							Column.NrDecimals = Column0.nrDecimals;

						Table.Columns.push(Column);
					}

					console.log("New table: " + Table.Name + " (" + Table.Id + ")");
				}
				else if (Data.newRecords)
				{
					var TableId = Data.newRecords.tableId;
					var Table = QueryRecord.Tables[TableId];

					if (Table)
					{
						if (Data.newRecords.record.length)
						{
							for (i = 0, c = Data.newRecords.record.length; i < c; i++)
								this.AddRecord(Table, Data.newRecords.record[i]);
						}
						else
							this.AddRecord(Table, Data.newRecords.record);
					}
					else
						console.log("Table not found: " + TableId);
				}
				else if (Data.tableDone)
				{
					var TableId = Data.tableDone.tableId;
					var Table = QueryRecord.Tables[TableId];

					Table.Done = true;

					console.log("Table done: " + TableId);
				}
				else if (Data.queryMessage)
				{
					var Message =
					{
						"Type": "Message",
						"Level": Data.queryMessage.level,
						"Text": Data.queryMessage.value
					};

					QueryRecord.CurrentSection.Items.push(Message);

					console.log("Message received: " + Message.Text);
				}
				else if (Data.queryDone)
				{
					console.log("Query completed.");
					QueryRecord.Done = true;
					QueryRecord.resolve(true);
					delete this.Queries[QueryId];
					delete QueryRecord.Status;
				}
				else if (Data.queryAborted)
				{
					console.log("Query aborted.");
					QueryRecord.Errors.push("Aborted.");
					QueryRecord.Done = true;
					QueryRecord.HasErrors = true;
					QueryRecord.resolve(false);
					delete this.Queries[QueryId];
					delete QueryRecord.Status;
				}
				else
				{
					console.log("Unrecognized query progress reported.");

					QueryRecord.Errors.push("Unrecognized query progress report: " + JSON.stringify(Data));
					QueryRecord.HasErrors = true;
				}
			},
			"AddRecord": function (Table, Record)
			{
				var Cells = [];
				var Items;
				var i, c;

				if (Record.__ordered)
					Items = Record.__ordered;
				else if (Record.boolean)
					Items = Record.boolean;
				else if (Record.date)
					Items = Record.date;
				else if (Record.dateTime)
					Items = Record.dateTime;
				else if (Record.double)
					Items = Record.double;
				else if (Record.duration)
					Items = Record.duration;
				else if (Record.int)
					Items = Record.int;
				else if (Record.long)
					Items = Record.long;
				else if (Record.string)
					Items = Record.string;
				else if (Record.time)
					Items = Record.time;
				else if (Record.quantity)
					Items = Record.quantity;
				else if (Record.measurement)
					Items = Record.measurement;
				else if (Record.base64)
					Items = Record.base64;
				else if (Record.color)
					Items = Record.color;
				else if (Record.void)
					Items = Record.void;
				else
				{
					console.log("Unexpected record items received: " + JSON.stringify(Data));
					return;
				}

				if (!Items.length)
					Items = [Items];

				for (i = 0, c = Items.length; i < c; i++)
				{
					var Item = Items[i];

					switch (Item.__name)
					{
						case "quantity":
							Cells.push(
								{
									"Type": "Quantity",
									"Magnitude": Item.m,
									"Unit": Item.u
								});
							break;

						case "measurement":
							Cells.push(
								{
									"Type": "Measurement",
									"Magnitude": Item.m,
									"Unit": Item.u,
									"Error": Item.e
								});
							break;

						case "base64":
							Cells.push(
								{
									"Type": "EncodedObject",
									"ContentType": Item.contentType,
									"Base64": Item.value
								});
							break;

						default:
							Cells.push(Item.value);
							break;
					}
				}

				Table.Records.push(Cells);
				console.log("Adding record to table: " + Table.Id);
			}
		}
		// TODO: getCommonNodeCommands
		// TODO: getCommonCommandParameters
		// TODO: executeCommonNodeCommand
		// TODO: executeCommonNodeQuery
		// TODO: abortNodeQuery
		// TODO: abortCommonNodeQuery
		// TODO: registerSniffer
		// TODO: unregisterSniffer
	},
	"Sensor":
	{
		"StartReadoutStandaloneDevice": async function (JID, Language, Momentary, Peak, Status, Computed, Identity, History,
			Fields, From, To, When, DeviceToken, ServiceToken, UserToken, Id)
		{
			return await this.StartReadoutConcentratorNode(JID, Language, Momentary, Peak, Status,
				Computed, Identity, History, Fields, From, To, When, null, null, null,
				DeviceToken, ServiceToken, UserToken, Id);
		},
		"StartReadoutConcentratorNode": async function (JID, Language, Momentary, Peak, Status, Computed, Identity, History,
			Fields, From, To, When, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken, Id)
		{
			if (!Id)
				Id = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));

			var Query = "<req xmlns='" + AgentAPI.Things.XmppHelper.SensorDataNamespace + "' id='" + Id + "'";
			Query = AgentAPI.Things.XmppHelper.AddLanguageAttribute(Query, Language);
			Query = AgentAPI.Things.XmppHelper.AddFieldTypeAttributes(Query, Momentary, Peak, Status, Computed, Identity, History);
			Query = AgentAPI.Things.XmppHelper.AddTimingAttributes(Query, From, To, When);
			Query = AgentAPI.Things.XmppHelper.AddTokenAttributes(Query, DeviceToken, ServiceToken, UserToken);
			Query += ">";

			if (NodeId || SourceId || Partition)
			{
				Query += "<nd";
				Query = AgentAPI.Things.XmppHelper.AddNodeReferenceAttributes(Query, NodeId, SourceId, Partition);
				Query += "/>";
			}

			Query = AgentAPI.Things.XmppHelper.AddFields(Query, Fields);
			Query += "</req>";

			JID = await AgentAPI.Things.XmppHelper.GetFullJid(JID, true);

			var Response = await AgentAPI.Xmpp.InformationQuery(JID, "get", Query, Language);
			AgentAPI.Things.XmppHelper.AssertResponseOk(Response);

			AgentAPI.IO.AfterResponse(Response);
			return Response;
		},
		"ReadStandaloneDevice": async function (JID, Language, Momentary, Peak, Status, Computed, Identity, History,
			Fields, From, To, When, DeviceToken, ServiceToken, UserToken)
		{
			return await this.ReadConcentratorNode(JID, Language, Momentary, Peak, Status,
				Computed, Identity, History, Fields, From, To, When, null, null, null,
				DeviceToken, ServiceToken, UserToken);
		},
		"ReadConcentratorNode": async function (JID, Language, Momentary, Peak, Status, Computed, Identity, History,
			Fields, From, To, When, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken)
		{
			var Id = AgentAPI.Account.Base64Encode(window.crypto.getRandomValues(new Uint8Array(32)));
			var ReadoutRecord =
			{
				"Fields": [],
				"Errors": [],
				"Ok": true,
				"HasErrors": false,
				"Accepted": false,
				"Started": false,
				"Done": false,
				"resolve": null
			};

			ReadoutRecord["Task"] = new Promise((resolve, reject) =>
			{
				ReadoutRecord["resolve"] = resolve;
				ReadoutRecord["reject"] = reject;
			});

			this.ReadoutProgress.Readouts[Id] = ReadoutRecord;

			if (!this.ReadoutProgress.EventHandlersRegistered)
			{
				await AgentAPI.Xmpp.RegisterEventHandler("accepted", AgentAPI.Things.XmppHelper.SensorDataNamespace,
					"", "AgentAPI.Things.Sensor.ReadoutProgress.OnAccepted");

				await AgentAPI.Xmpp.RegisterEventHandler("started", AgentAPI.Things.XmppHelper.SensorDataNamespace,
					"", "AgentAPI.Things.Sensor.ReadoutProgress.OnStarted");

				await AgentAPI.Xmpp.RegisterEventHandler("resp", AgentAPI.Things.XmppHelper.SensorDataNamespace,
					"", "AgentAPI.Things.Sensor.ReadoutProgress.OnResp");

				this.ReadoutProgress.EventHandlersRegistered = true;
			}

			var Data = await this.StartReadoutConcentratorNode(JID, Language, Momentary, Peak, Status, Computed, Identity, History,
				Fields, From, To, When, NodeId, SourceId, Partition, DeviceToken, ServiceToken, UserToken, Id);

			if (Data.Stanza)
			{
				if (Data.Stanza.accepted)
					AgentAPI.Things.Sensor.ReadoutProgress.OnAccepted(Data.Stanza.accepted);

				if (Data.Stanza.started)
					AgentAPI.Things.Sensor.ReadoutProgress.OnStarted(Data.Stanza.started);

				if (Data.Stanza.resp)
					AgentAPI.Things.Sensor.ReadoutProgress.OnResp(Data.Stanza.resp);
			}

			await ReadoutRecord.Task;

			delete ReadoutRecord.Task;
			delete ReadoutRecord.resolve;
			delete ReadoutRecord.reject;

			AgentAPI.IO.AfterResponse(ReadoutRecord);
			return ReadoutRecord;
		},
		"ReadoutProgress":
		{
			"Readouts": {},
			"EventHandlersRegistered": false,
			"OnAccepted": function (Data)
			{
				console.log("Sensor data readout accepted. Id=" + Data.id);

				var ReadoutRecord = this.Readouts[Data.id];
				if (!ReadoutRecord)
				{
					console.warn("Sensor data event not recognized. Ignored.");
					return;
				}

				ReadoutRecord.Accepted = true;
			},
			"OnStarted": function (Data)
			{
				console.log("Sensor data readout started. Id=" + Data.id);

				var ReadoutRecord = this.Readouts[Data.id];
				if (!ReadoutRecord)
				{
					console.warn("Sensor data event not recognized. Ignored.");
					return;
				}

				ReadoutRecord.Accepted = true;
				ReadoutRecord.Started = true;
			},
			"OnResp": function (Data)
			{
				console.log("Sensor data event received. Id=" + Data.id);

				var ReadoutRecord = this.Readouts[Data.id];
				if (!ReadoutRecord)
				{
					console.warn("Sensor data event not recognized. Ignored.");
					return;
				}

				var Node = Data.nd;
				var Timestamp;

				if (Node)
					Timestamp = Node.ts;
				else
					Timestamp = Data.ts;

				var i, c;

				if (c = Timestamp.length)
				{
					for (i = 0; i < c; i++)
						this.AddTimestamp(ReadoutRecord, Timestamp[i]);
				}
				else
					this.AddTimestamp(ReadoutRecord, Timestamp);

				ReadoutRecord.Accepted = true;
				ReadoutRecord.Started = true;

				if (!Data.more)
				{
					console.log("Sensor data readout completed.");
					ReadoutRecord.Done = true;
					ReadoutRecord.resolve(true);
					delete this.Readouts[Data.id];
				}
			},
			"AddTimestamp": function (ReadoutRecord, TimestampObj)
			{
				var Timestamp = TimestampObj.v;

				if (TimestampObj.b)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.b);

				if (TimestampObj.d)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.d);

				if (TimestampObj.dt)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.dt);

				if (TimestampObj.dr)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.dr);

				if (TimestampObj.e)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.e);

				if (TimestampObj.i)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.i);

				if (TimestampObj.l)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.l);

				if (TimestampObj.q)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.q);

				if (TimestampObj.s)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.s);

				if (TimestampObj.t)
					this.AddFields(Timestamp, ReadoutRecord, TimestampObj.t);

				if (TimestampObj.err)
					this.AddErrors(Timestamp, ReadoutRecord, TimestampObj.err);
			},
			"AddFields": function (Timestamp, ReadoutRecord, Fields)
			{
				var i, c;

				if (c = Fields.length)
				{
					for (i = 0; i < c; i++)
						this.AddField(Timestamp, ReadoutRecord, Fields[i]);
				}
				else
					this.AddField(Timestamp, ReadoutRecord, Fields);
			},
			"AddErrors": function (Timestamp, ReadoutRecord, Errors)
			{
				var i, c;

				if (c = Errors.length)
				{
					for (i = 0; i < c; i++)
						this.AddError(Timestamp, ReadoutRecord, Errors[i]);
				}
				else
					this.AddError(Timestamp, ReadoutRecord, Errors);
			},
			"AddField": function (Timestamp, ReadoutRecord, FieldObj)
			{
				FieldObj["ts"] = Timestamp;
				ReadoutRecord.Fields.push(FieldObj);
			},
			"AddError": function (Timestamp, ReadoutRecord, ErrorObj)
			{
				ErrorObj["ts"] = Timestamp;
				ReadoutRecord.Errors.push(ErrorObj);
			}
		}
	},
	"Actuator":
	{
	}
};
