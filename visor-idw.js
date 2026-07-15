/* ═══════════════════════════════════════════════════════════════════════════
   visor-idw.js · Motor IDW para Power BI (HTML Content, versión con scripts)
   ───────────────────────────────────────────────────────────────────────────
   Formato multi-fecha (con slider integrado):

     <div id="idw-root" style="position:absolute;inset:0;"></div>
     <script>window.IDW_DATA = {
       fechas: ["29/04/2026","05/05/2026","20/05/2026"],   // orden ascendente
       hitos: [
         // [id, lat, lon, "serie dz alineada con fechas, ';' separador, vacío = sin medición"]
         ["H1.01", 43.2309635, -2.8365123, "-1.2;-2.0;-3.5"],
         ["H1.02", 43.2311000, -2.8362000, ";-4.1;-5.8"],
         ...
       ]
     };</script>
     <script src="https://l5ag.github.io/Hitos/visor-idw.js"></script>

   También acepta el formato antiguo de una sola fecha:
     { fecha:"09/06/2026", hitos:[["H1.01",lat,lon,dz], ...] }

   El slider acumula: para la fecha seleccionada cada hito usa su última
   medición anterior o igual a esa fecha. Los datos viajan dentro del visual.

   v14 añade sobre el IDW por bandas:
     · Ejes L5 2026 incrustados y frentes de túnel (engranajes que avanzan con la fecha).
     · Gráfica de evolución por hito al pasar el ratón (eje ajustado a su rango).
     · Frentes desde window.FRENTES (NO embebidos). Formato admitido:
         window.FRENTES = [ ["OLBE","2025-10-09", 2030.3, 43.230123, -2.837456], ... ]
         (filas [nombre, fecha(YYYY-MM-DD o DD/MM/YYYY), pk, lat, lon]; el motor las agrupa por frente)
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var VERSION = 'v14';

  // ── Trazados L5 (polilíneas incrustadas desde Trazados_L5_con_cuneta_2027.kml) ──
  var TRAZADOS = [
    { n: "eje 197 Tronco (polígono 10 m)", c: "#30f71e", w: 2, d: null, pts: [[43.236701,-2.869582],[43.236547,-2.869216],[43.235482,-2.866692],[43.235396,-2.866488],[43.235356,-2.866385],[43.235321,-2.866295],[43.235287,-2.866204],[43.235254,-2.866112],[43.235223,-2.86602],[43.235193,-2.865927],[43.235163,-2.865833],[43.235135,-2.865739],[43.235108,-2.865644],[43.235083,-2.865548],[43.235058,-2.865452],[43.235035,-2.865355],[43.235013,-2.865258],[43.234992,-2.86516],[43.234972,-2.865062],[43.234953,-2.864963],[43.234936,-2.864864],[43.23492,-2.864764],[43.234902,-2.86465],[43.234871,-2.864418],[43.234606,-2.862447],[43.234575,-2.862214],[43.234557,-2.862097],[43.234544,-2.862018],[43.23453,-2.861939],[43.234516,-2.86186],[43.234501,-2.861781],[43.234485,-2.861703],[43.234469,-2.861625],[43.234451,-2.861547],[43.234433,-2.86147],[43.234415,-2.861393],[43.234395,-2.861316],[43.234375,-2.861239],[43.234354,-2.861163],[43.234332,-2.861088],[43.23431,-2.861012],[43.234287,-2.860938],[43.234263,-2.860863],[43.234238,-2.860789],[43.234202,-2.860681],[43.234125,-2.860468],[43.233516,-2.858794],[43.233491,-2.858724],[43.233478,-2.858688],[43.233469,-2.858666],[43.233461,-2.858643],[43.233453,-2.85862],[43.233444,-2.858598],[43.233436,-2.858575],[43.233427,-2.858552],[43.233419,-2.85853],[43.23341,-2.858507],[43.233402,-2.858485],[43.233393,-2.858462],[43.233385,-2.858439],[43.233376,-2.858417],[43.233368,-2.858394],[43.233359,-2.858372],[43.23335,-2.858349],[43.233342,-2.858327],[43.233333,-2.858304],[43.233319,-2.858269],[43.233292,-2.8582],[43.232459,-2.856069],[43.232297,-2.855653],[43.232234,-2.855438],[43.232215,-2.855368],[43.232197,-2.855298],[43.23218,-2.855228],[43.232165,-2.855157],[43.232151,-2.855086],[43.232138,-2.855014],[43.232126,-2.854941],[43.232116,-2.854869],[43.232107,-2.854796],[43.232099,-2.854722],[43.232093,-2.854649],[43.232088,-2.854575],[43.232084,-2.854501],[43.232082,-2.854427],[43.23208,-2.854353],[43.232081,-2.854279],[43.232082,-2.854205],[43.232089,-2.853974],[43.232143,-2.853508],[43.232252,-2.852563],[43.232286,-2.85227],[43.232298,-2.852121],[43.232307,-2.851994],[43.232314,-2.851867],[43.232318,-2.85174],[43.23232,-2.851612],[43.23232,-2.851485],[43.232317,-2.851357],[43.232312,-2.85123],[43.232305,-2.851103],[43.232295,-2.850976],[43.232283,-2.850849],[43.232268,-2.850723],[43.232251,-2.850598],[43.232232,-2.850473],[43.23221,-2.850349],[43.232186,-2.850226],[43.23216,-2.850103],[43.232132,-2.849982],[43.232097,-2.84984],[43.232019,-2.849563],[43.23133,-2.847122],[43.231206,-2.846682],[43.231163,-2.846458],[43.231155,-2.846414],[43.231147,-2.846369],[43.23114,-2.846325],[43.231134,-2.84628],[43.231128,-2.846235],[43.231122,-2.84619],[43.231117,-2.846145],[43.231112,-2.8461],[43.231108,-2.846055],[43.231104,-2.846009],[43.231101,-2.845964],[43.231099,-2.845918],[43.231096,-2.845873],[43.231095,-2.845827],[43.231094,-2.845782],[43.231093,-2.845736],[43.231093,-2.845691],[43.231093,-2.845459],[43.231134,-2.844991],[43.231335,-2.842692],[43.231376,-2.84222],[43.231377,-2.841978],[43.231377,-2.841903],[43.231375,-2.841827],[43.231372,-2.841751],[43.231367,-2.841676],[43.231362,-2.841601],[43.231354,-2.841525],[43.231346,-2.841451],[43.231336,-2.841376],[43.231325,-2.841302],[43.231313,-2.841228],[43.231299,-2.841154],[43.231284,-2.841081],[43.231268,-2.841009],[43.23125,-2.840937],[43.231231,-2.840866],[43.231211,-2.840795],[43.23119,-2.840725],[43.23112,-2.840504],[43.230947,-2.840091],[43.229781,-2.837317],[43.229703,-2.837378],[43.230869,-2.840153],[43.23104,-2.840561],[43.231107,-2.840774],[43.231128,-2.840841],[43.231147,-2.840909],[43.231165,-2.840978],[43.231182,-2.841047],[43.231198,-2.841116],[43.231212,-2.841186],[43.231225,-2.841257],[43.231237,-2.841328],[43.231248,-2.841399],[43.231257,-2.841471],[43.231265,-2.841543],[43.231272,-2.841615],[43.231278,-2.841687],[43.231282,-2.84176],[43.231285,-2.841833],[43.231287,-2.841905],[43.231287,-2.841978],[43.231287,-2.84221],[43.231246,-2.842678],[43.231045,-2.844976],[43.231004,-2.845449],[43.231003,-2.84569],[43.231003,-2.845738],[43.231004,-2.845785],[43.231005,-2.845833],[43.231006,-2.84588],[43.231009,-2.845927],[43.231011,-2.845975],[43.231015,-2.846022],[43.231019,-2.846069],[43.231023,-2.846116],[43.231028,-2.846163],[43.231033,-2.84621],[43.231039,-2.846257],[43.231045,-2.846303],[43.231052,-2.84635],[43.23106,-2.846396],[43.231068,-2.846443],[43.231076,-2.846489],[43.23112,-2.846722],[43.231246,-2.847166],[43.231935,-2.849608],[43.232012,-2.849883],[43.232046,-2.850021],[43.232074,-2.85014],[43.2321,-2.850259],[43.232123,-2.850379],[43.232144,-2.8505],[43.232163,-2.850622],[43.232179,-2.850744],[43.232193,-2.850867],[43.232205,-2.85099],[43.232215,-2.851114],[43.232222,-2.851238],[43.232227,-2.851362],[43.23223,-2.851487],[43.23223,-2.851611],[43.232228,-2.851735],[43.232224,-2.85186],[43.232217,-2.851984],[43.232208,-2.852108],[43.232197,-2.852253],[43.232163,-2.852544],[43.232054,-2.853489],[43.232,-2.853959],[43.231992,-2.854201],[43.231991,-2.854277],[43.23199,-2.854354],[43.231992,-2.854431],[43.231994,-2.854508],[43.231998,-2.854585],[43.232003,-2.854662],[43.23201,-2.854739],[43.232018,-2.854815],[43.232027,-2.854891],[43.232038,-2.854966],[43.23205,-2.855042],[43.232064,-2.855116],[43.232078,-2.855191],[43.232094,-2.855265],[43.232112,-2.855338],[43.232131,-2.855411],[43.232151,-2.855482],[43.232216,-2.855707],[43.232379,-2.856127],[43.233213,-2.858258],[43.23324,-2.858327],[43.233253,-2.858362],[43.233262,-2.858384],[43.233271,-2.858407],[43.233279,-2.858429],[43.233288,-2.858451],[43.233296,-2.858474],[43.233305,-2.858496],[43.233313,-2.858519],[43.233322,-2.858541],[43.23333,-2.858563],[43.233339,-2.858586],[43.233347,-2.858608],[43.233356,-2.858631],[43.233364,-2.858653],[43.233372,-2.858676],[43.233381,-2.858698],[43.233389,-2.858721],[43.233397,-2.858744],[43.23341,-2.858779],[43.233436,-2.858849],[43.234044,-2.860523],[43.234121,-2.860735],[43.234157,-2.860841],[43.234181,-2.860913],[43.234204,-2.860986],[43.234227,-2.86106],[43.234249,-2.861133],[43.23427,-2.861208],[43.234291,-2.861282],[43.23431,-2.861357],[43.234329,-2.861432],[43.234348,-2.861508],[43.234366,-2.861584],[43.234382,-2.86166],[43.234399,-2.861736],[43.234414,-2.861813],[43.234429,-2.86189],[43.234443,-2.861967],[43.234456,-2.862045],[43.234469,-2.862123],[43.234487,-2.862237],[43.234518,-2.862469],[43.234782,-2.86444],[43.234813,-2.864673],[43.234832,-2.86479],[43.234848,-2.864892],[43.234866,-2.864993],[43.234885,-2.865093],[43.234905,-2.865194],[43.234926,-2.865293],[43.234949,-2.865393],[43.234973,-2.865491],[43.234998,-2.86559],[43.235024,-2.865687],[43.235052,-2.865784],[43.23508,-2.86588],[43.23511,-2.865976],[43.235141,-2.866071],[43.235173,-2.866165],[43.235206,-2.866259],[43.235241,-2.866352],[43.235276,-2.866443],[43.235318,-2.866549],[43.235404,-2.866754],[43.236469,-2.869277],[43.236623,-2.869644],[43.236701,-2.869582]] },
    { n: "EJE OS-10 250213 Vent (polígono 10 m)", c: "#04b831", w: 2, d: null, pts: [[43.229952,-2.837848],[43.2303,-2.837574],[43.230322,-2.837556],[43.230343,-2.837535],[43.230363,-2.837513],[43.230383,-2.837488],[43.2304,-2.837463],[43.230417,-2.837435],[43.230433,-2.837407],[43.230446,-2.837376],[43.230459,-2.837345],[43.23047,-2.837313],[43.23048,-2.83728],[43.230488,-2.837246],[43.230494,-2.837211],[43.230499,-2.837176],[43.230502,-2.837141],[43.230503,-2.837105],[43.230503,-2.83707],[43.230435,-2.834942],[43.230434,-2.834923],[43.230433,-2.834903],[43.230431,-2.834883],[43.230429,-2.834864],[43.230427,-2.834844],[43.230425,-2.834825],[43.230422,-2.834805],[43.230418,-2.834786],[43.230415,-2.834767],[43.230411,-2.834748],[43.230407,-2.834729],[43.230402,-2.834711],[43.230397,-2.834692],[43.230392,-2.834674],[43.230386,-2.834655],[43.23038,-2.834637],[43.230374,-2.83462],[43.230101,-2.833873],[43.23002,-2.833928],[43.230293,-2.834675],[43.230298,-2.83469],[43.230303,-2.834705],[43.230308,-2.83472],[43.230313,-2.834736],[43.230317,-2.834752],[43.230321,-2.834767],[43.230325,-2.834783],[43.230328,-2.834799],[43.230331,-2.834816],[43.230334,-2.834832],[43.230336,-2.834848],[43.230338,-2.834865],[43.23034,-2.834881],[43.230342,-2.834898],[43.230343,-2.834914],[43.230344,-2.834931],[43.230345,-2.834948],[43.230413,-2.837075],[43.230413,-2.837103],[43.230412,-2.837131],[43.23041,-2.837158],[43.230406,-2.837185],[43.230401,-2.837212],[43.230395,-2.837239],[43.230387,-2.837264],[43.230379,-2.837289],[43.230369,-2.837314],[43.230358,-2.837337],[43.230346,-2.837359],[43.230333,-2.837381],[43.230319,-2.837401],[43.230304,-2.83742],[43.230289,-2.837437],[43.230272,-2.837453],[43.230255,-2.837468],[43.229907,-2.837741],[43.229952,-2.837848]] },
    { n: "EJE OS-1 250313 SalEmer (polígono 10 m)", c: "#04b831", w: 2, d: null, pts: [[43.234844,-2.864562],[43.234711,-2.864597],[43.234707,-2.864598],[43.234703,-2.864598],[43.234698,-2.864598],[43.234694,-2.864598],[43.23469,-2.864597],[43.234685,-2.864596],[43.234681,-2.864595],[43.234677,-2.864593],[43.234673,-2.86459],[43.234669,-2.864588],[43.234666,-2.864585],[43.234662,-2.864581],[43.234659,-2.864578],[43.234655,-2.864574],[43.234652,-2.86457],[43.23465,-2.864565],[43.234647,-2.86456],[43.234645,-2.864555],[43.234599,-2.864448],[43.234522,-2.86451],[43.234567,-2.864617],[43.234572,-2.864629],[43.234579,-2.864641],[43.234585,-2.864652],[43.234593,-2.864662],[43.2346,-2.864672],[43.234609,-2.864681],[43.234617,-2.864689],[43.234626,-2.864696],[43.234636,-2.864702],[43.234645,-2.864708],[43.234655,-2.864713],[43.234666,-2.864716],[43.234676,-2.864719],[43.234686,-2.864721],[43.234697,-2.864721],[43.234707,-2.864721],[43.234718,-2.86472],[43.234728,-2.864718],[43.234861,-2.864683],[43.234844,-2.864562]] },
    { n: "EJE OS-1 250313 Vent (polígono 10 m)", c: "#04b831", w: 2, d: null, pts: [[43.234812,-2.864318],[43.234678,-2.864352],[43.234651,-2.86436],[43.234624,-2.864371],[43.234597,-2.864384],[43.234572,-2.8644],[43.234547,-2.864418],[43.234523,-2.864439],[43.2345,-2.864462],[43.234479,-2.864487],[43.234459,-2.864513],[43.23444,-2.864542],[43.234423,-2.864573],[43.234407,-2.864605],[43.234393,-2.864638],[43.234381,-2.864673],[43.23437,-2.864709],[43.234362,-2.864745],[43.234355,-2.864783],[43.23435,-2.86482],[43.23433,-2.865018],[43.234327,-2.865041],[43.234324,-2.865063],[43.23432,-2.865086],[43.234315,-2.865108],[43.23431,-2.86513],[43.234304,-2.865151],[43.234297,-2.865172],[43.23429,-2.865193],[43.234282,-2.865213],[43.234274,-2.865233],[43.234264,-2.865253],[43.234255,-2.865271],[43.234244,-2.86529],[43.234234,-2.865307],[43.234222,-2.865324],[43.23421,-2.865341],[43.234198,-2.865356],[43.234133,-2.865435],[43.234193,-2.865527],[43.234258,-2.865448],[43.234273,-2.865429],[43.234288,-2.865409],[43.234301,-2.865388],[43.234315,-2.865367],[43.234327,-2.865344],[43.234339,-2.865322],[43.23435,-2.865298],[43.234361,-2.865274],[43.23437,-2.865249],[43.234379,-2.865223],[43.234387,-2.865198],[43.234395,-2.865171],[43.234401,-2.865145],[43.234407,-2.865118],[43.234412,-2.86509],[43.234416,-2.865063],[43.234419,-2.865035],[43.234439,-2.864838],[43.234443,-2.864808],[43.234448,-2.864779],[43.234455,-2.86475],[43.234463,-2.864723],[43.234473,-2.864696],[43.234484,-2.86467],[43.234496,-2.864645],[43.234509,-2.864621],[43.234524,-2.864599],[43.234539,-2.864578],[43.234556,-2.864558],[43.234574,-2.864541],[43.234592,-2.864525],[43.234612,-2.86451],[43.234632,-2.864498],[43.234652,-2.864488],[43.234673,-2.864479],[43.234695,-2.864473],[43.234828,-2.864439],[43.234812,-2.864318]] },
    { n: "EJE OS10 250213 Emer (polígono 10 m)", c: "#04b831", w: 2, d: null, pts: [[43.229861,-2.837632],[43.229997,-2.837526],[43.23,-2.837524],[43.230003,-2.837522],[43.230006,-2.83752],[43.230009,-2.837519],[43.230012,-2.837518],[43.230015,-2.837518],[43.230018,-2.837517],[43.230021,-2.837517],[43.230024,-2.837518],[43.230027,-2.837518],[43.23003,-2.837519],[43.230033,-2.83752],[43.230036,-2.837521],[43.230039,-2.837523],[43.230041,-2.837525],[43.230044,-2.837527],[43.230047,-2.83753],[43.230049,-2.837532],[43.230051,-2.837535],[43.230053,-2.837538],[43.230055,-2.837541],[43.230057,-2.837545],[43.230059,-2.837548],[43.230105,-2.837657],[43.230183,-2.837596],[43.230137,-2.837487],[43.230132,-2.837476],[43.230127,-2.837466],[43.230121,-2.837456],[43.230114,-2.837447],[43.230107,-2.837439],[43.2301,-2.837431],[43.230093,-2.837424],[43.230085,-2.837417],[43.230077,-2.837411],[43.230068,-2.837406],[43.230059,-2.837402],[43.23005,-2.837399],[43.230041,-2.837397],[43.230032,-2.837395],[43.230023,-2.837394],[43.230014,-2.837394],[43.230005,-2.837395],[43.229995,-2.837397],[43.229986,-2.8374],[43.229978,-2.837403],[43.229969,-2.837408],[43.229961,-2.837413],[43.229952,-2.837419],[43.229817,-2.837526],[43.229861,-2.837632]] },
    { n: "Polilínea cerrada (DXF) - Cian 40%", c: "#00ffff", w: 2, d: "6,6", pts: [[43.230797,-2.846294],[43.230921,-2.847361],[43.231118,-2.848577],[43.231559,-2.849665],[43.231844,-2.850732],[43.232008,-2.85184],[43.231936,-2.853036],[43.231828,-2.854299],[43.232,-2.855619],[43.232489,-2.856692],[43.232791,-2.857588],[43.232692,-2.85766],[43.232862,-2.858094],[43.232978,-2.858428],[43.23302,-2.858535],[43.233101,-2.858749],[43.233161,-2.85891],[43.233197,-2.859008],[43.233806,-2.860684],[43.233898,-2.860942],[43.23381,-2.860999],[43.233877,-2.861204],[43.233938,-2.861413],[43.233994,-2.861626],[43.234041,-2.861835],[43.233727,-2.861957],[43.233739,-2.862017],[43.233775,-2.862207],[43.233808,-2.862414],[43.233839,-2.862643],[43.233866,-2.86295],[43.23411,-2.864772],[43.234411,-2.864694],[43.234736,-2.865958],[43.235227,-2.867077],[43.235722,-2.868109],[43.236186,-2.869164],[43.236476,-2.869806],[43.236952,-2.869389],[43.236771,-2.868702],[43.236365,-2.867601],[43.235877,-2.866564],[43.235544,-2.86552],[43.235579,-2.864351],[43.235341,-2.86258],[43.235222,-2.861845],[43.235206,-2.861751],[43.235189,-2.861653],[43.235153,-2.861464],[43.235141,-2.861405],[43.234826,-2.861528],[43.234766,-2.861267],[43.234701,-2.861015],[43.234628,-2.860768],[43.234548,-2.860523],[43.23446,-2.86058],[43.234362,-2.860306],[43.233753,-2.85863],[43.233716,-2.85853],[43.233654,-2.858362],[43.233569,-2.858139],[43.233526,-2.858028],[43.233387,-2.85771],[43.233217,-2.857276],[43.233135,-2.857336],[43.232775,-2.856482],[43.232427,-2.855378],[43.232333,-2.854306],[43.232625,-2.853184],[43.232676,-2.851895],[43.232512,-2.850557],[43.232284,-2.849282],[43.232088,-2.848065],[43.231841,-2.846876],[43.231439,-2.846108],[43.231422,-2.845936],[43.231414,-2.845733],[43.231418,-2.845519],[43.231432,-2.845295],[43.231388,-2.845289],[43.231415,-2.844804],[43.231514,-2.843917],[43.231594,-2.843593],[43.231643,-2.843026],[43.231752,-2.84236],[43.231593,-2.840946],[43.231197,-2.83971],[43.231139,-2.839471],[43.231443,-2.839233],[43.23091,-2.837946],[43.230938,-2.837283],[43.230864,-2.836904],[43.230821,-2.83666],[43.230822,-2.836413],[43.230898,-2.836162],[43.230891,-2.835916],[43.230877,-2.83567],[43.230861,-2.835425],[43.23084,-2.835179],[43.230814,-2.834934],[43.230695,-2.834546],[43.230528,-2.834326],[43.230417,-2.834127],[43.230267,-2.833954],[43.230167,-2.833827],[43.229958,-2.83397],[43.229958,-2.834166],[43.230024,-2.834395],[43.230041,-2.834659],[43.23009,-2.834855],[43.230101,-2.834977],[43.230137,-2.835221],[43.230151,-2.835467],[43.230127,-2.835715],[43.230077,-2.835951],[43.230062,-2.835915],[43.229707,-2.836194],[43.228945,-2.834379],[43.228947,-2.834378],[43.228862,-2.834172],[43.22878,-2.833964],[43.228701,-2.833753],[43.228663,-2.833647],[43.227957,-2.834121],[43.227999,-2.834235],[43.228084,-2.834463],[43.228173,-2.834689],[43.228265,-2.834912],[43.228267,-2.834911],[43.22903,-2.836726],[43.228675,-2.837005],[43.229079,-2.837966],[43.230077,-2.840306],[43.230411,-2.840044],[43.230517,-2.840245],[43.230885,-2.841234],[43.23095,-2.842265],[43.230748,-2.843455],[43.230814,-2.844706],[43.230795,-2.845205],[43.230703,-2.845192],[43.230687,-2.845459],[43.230682,-2.845738],[43.230692,-2.846027],[43.23072,-2.846313]] }
  ];

  // ── Escala de colores (anclas cada 2 mm, bandas cada 1 mm) ────────────────
  var NEG_ANCHORS = [
    [-2, [250, 230, 100]], [-4, [245, 180, 50]], [-6, [230, 100, 30]],
    [-8, [180, 30, 20]], [-10, [80, 0, 0]], [-14, [40, 0, 0]]
  ];
  var POS_ANCHORS = [
    [2, [198, 219, 239]], [4, [158, 202, 225]], [6, [107, 174, 214]],
    [8, [66, 146, 198]], [10, [33, 113, 181]], [14, [8, 48, 107]]
  ];
  function rampColor(anchors, v) {
    var a = anchors;
    if ((v - a[0][0]) * (a[a.length - 1][0] - a[0][0]) <= 0) return a[0][1].join(',');
    for (var i = 0; i < a.length - 1; i++) {
      var v0 = a[i][0], c0 = a[i][1], v1 = a[i + 1][0], c1 = a[i + 1][1];
      var t = (v - v0) / (v1 - v0);
      if (t >= 0 && t <= 1) {
        return c0.map(function (c, k) { return Math.round(c + (c1[k] - c) * t); }).join(',');
      }
    }
    return a[a.length - 1][1].join(',');
  }
  var NEG_LEVELS = [], POS_LEVELS = [], v;
  for (v = -2; v >= -13; v--) NEG_LEVELS.push({ level: v, color: rampColor(NEG_ANCHORS, v - 0.5), deep: v <= -10 });
  NEG_LEVELS.push({ level: -14, color: '40,0,0', deep: true });
  for (v = 2; v <= 13; v++) POS_LEVELS.push({ level: v, color: rampColor(POS_ANCHORS, v + 0.5) });
  POS_LEVELS.push({ level: 14, color: '8,48,107' });

  // ── Carga dinámica de Leaflet ──────────────────────────────────────────────
  function loadLeaflet(cb) {
    if (window.L) return cb();
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  // ── IDW normalizado (todos los puntos) sobre malla local en metros ────────
  var CELL = 4, PAD = 120;
  // reach: alcance (m). Más allá de esa distancia al hito más cercano el valor decae a 0 (terreno estable),
  // para que las bandas se cierren alrededor de los puntos en vez de llenar el ráster.
  function computeGrid(pts, bbox, W, H, power, reach) {
    var N = pts.length, halfP = power / 2;
    var reach2 = reach > 0 ? reach * reach : 0;
    var grid = new Float64Array(W * H);
    var xSpan = bbox.e - bbox.w, ySpan = bbox.n - bbox.s;
    for (var row = 0; row < H; row++) {
      var ym = bbox.n - ySpan * row / (H - 1), base = row * W;
      for (var col = 0; col < W; col++) {
        var xm = bbox.w + xSpan * col / (W - 1);
        var sw = 0, swz = 0, exact = null, d2min = Infinity;
        for (var j = 0; j < N; j++) {
          var dx = xm - pts[j].x, dy = ym - pts[j].y, d2 = dx * dx + dy * dy;
          if (d2 < d2min) d2min = d2;
          if (d2 < 0.25) { exact = pts[j].dz; break; }
          var w = halfP === 1 ? 1 / d2 : 1 / Math.pow(d2, halfP);
          sw += w; swz += w * pts[j].dz;
        }
        var v = exact !== null ? exact : (sw > 0 ? swz / sw : 0);
        if (exact === null && reach2 > 0) {
          if (d2min >= reach2) v = 0;
          else {
            var f = 1 - d2min / reach2;   // 1 en el punto, 0 en el alcance
            v *= f * f;                    // decaimiento suave
          }
        }
        grid[base + col] = v;
      }
    }
    return grid;
  }

  // ── Marching squares + costura de anillos ─────────────────────────────────
  function marchingSegs(grid, W, H, level) {
    var segs = [];
    function lerp(a, b) { return Math.abs(b - a) < 1e-12 ? 0.5 : (level - a) / (b - a); }
    for (var r = 0; r < H - 1; r++) {
      for (var c = 0; c < W - 1; c++) {
        var tl = grid[r * W + c], tr = grid[r * W + c + 1], br = grid[(r + 1) * W + c + 1], bl = grid[(r + 1) * W + c];
        var idx = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var top = [c + lerp(tl, tr), r], right = [c + 1, r + lerp(tr, br)],
            bottom = [c + lerp(bl, br), r + 1], left = [c, r + lerp(tl, bl)];
        var T = [null, [left, bottom], [bottom, right], [left, right], [top, right], null, [top, bottom], [top, left],
                 [top, left], [top, bottom], null, [top, right], [left, right], [bottom, right], [left, bottom], null];
        if (idx === 5) { segs.push([top, left]); segs.push([bottom, right]); }
        else if (idx === 10) { segs.push([top, right]); segs.push([bottom, left]); }
        else if (T[idx]) segs.push(T[idx]);
      }
    }
    return segs;
  }
  function stitchRings(segs) {
    if (!segs.length) return [];
    var PREC = 1e4;
    function key(p) { return Math.round(p[0] * PREC) + ',' + Math.round(p[1] * PREC); }
    var adj = new Map();
    segs.forEach(function (sg, i) {
      [key(sg[0]), key(sg[1])].forEach(function (k, end) {
        if (!adj.has(k)) adj.set(k, []);
        adj.get(k).push({ i: i, end: end });
      });
    });
    var used = new Uint8Array(segs.length), rings = [];
    for (var si = 0; si < segs.length; si++) {
      if (used[si]) continue;
      var ring = [], ci = si, cEnd = 0, startKey = key(segs[si][0]);
      for (var it = 0; it <= segs.length; it++) {
        if (used[ci]) break;
        used[ci] = 1;
        ring.push(segs[ci][cEnd]);
        var ek = key(segs[ci][1 - cEnd]);
        if (ek === startKey && ring.length > 2) { rings.push(ring); break; }
        var cand = adj.get(ek) || [], nxt = null;
        for (var q = 0; q < cand.length; q++) if (!used[cand[q].i]) { nxt = cand[q]; break; }
        if (!nxt) break;
        ci = nxt.i; cEnd = nxt.end;
      }
    }
    return rings;
  }

  // ── Normalización de datos (multi-fecha o formato antiguo) ────────────────
  function num(s) {
    if (s === '' || s === null || s === undefined) return null;
    if (typeof s === 'number') return isNaN(s) ? null : s;
    var x = parseFloat(String(s).trim().replace(',', '.'));
    return isNaN(x) ? null : x;
  }
  function parseData(raw) {
    var multi = raw.hitos.length && typeof raw.hitos[0][3] === 'string' && raw.hitos[0][3].indexOf(';') >= 0;
    if ((raw.fechas && raw.fechas.length) || multi) {
      var hitos = raw.hitos.map(function (h) {
        return { id: h[0], lat: h[1], lon: h[2], serie: String(h[3]).split(';').map(num) };
      });
      var nF = raw.fechas && raw.fechas.length ? raw.fechas.length : 0;
      hitos.forEach(function (h) { if (h.serie.length > nF) nF = h.serie.length; });
      var fechas = [];
      for (var i = 0; i < nF; i++) {
        fechas.push(raw.fechas && raw.fechas[i] ? raw.fechas[i] : 'F' + (i + 1));
      }
      hitos.forEach(function (h) { while (h.serie.length < nF) h.serie.push(null); });
      return { fechas: fechas, hitos: hitos };
    }
    return {
      fechas: [raw.fecha || ''],
      hitos: raw.hitos.map(function (h) {
        return { id: h[0], lat: h[1], lon: h[2], serie: [num(h[3]) === null ? 0 : num(h[3])] };
      })
    };
  }
  // Acumulado: última medición con índice ≤ i
  function dzAt(h, i) {
    for (var k = i; k >= 0; k--) if (h.serie[k] !== null && !isNaN(h.serie[k])) return h.serie[k];
    return null;
  }

  // Frentes de túnel: acepta array plano de Power BI [nombre, fecha, pk, lat, lon]
  // o el objeto ya agrupado { NOMBRE:{color,pos:[[iso,lat,lon,pk],...]} }.
  function normalizeFrentes(raw) {
    if (!raw) return null;
    var COL = { OLBE:'#ff6b35', OLAP:'#3fb950', ABGA:'#388bfd', ABHO:'#d29922', BEGA:'#a371f7' };
    var PAL = ['#a371f7', '#2be2ec', '#f778ba', '#7ee787', '#ffa657', '#d29922'];
    var byName = {}, order = [];
    if (!Array.isArray(raw)) {
      Object.keys(raw).forEach(function (k) { if (raw[k] && raw[k].pos) raw[k].pos.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; }); });
      return raw;
    }
    for (var i = 0; i < raw.length; i++) {
      var r = raw[i];
      if (!r || r.length < 5) continue;
      var nm = String(r[0]);
      if (!byName[nm]) { byName[nm] = { color: COL[nm] || PAL[order.length % PAL.length], pos: [] }; order.push(nm); }
      byName[nm].pos.push([String(r[1]), +r[3], +r[4], +r[2]]);   // [iso, lat, lon, pk]
    }
    Object.keys(byName).forEach(function (k) { byName[k].pos.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; }); });
    return byName;
  }

  // ── Render principal ───────────────────────────────────────────────────────
  function render() {
    var raw = window.IDW_DATA;
    var root = document.getElementById('idw-root');
    if (!root) return;
    if (!raw || !raw.hitos || !raw.hitos.length) {
      root.style.cssText += ';display:flex;align-items:center;justify-content:center;background:#0d1117;color:#e6edf3;font:13px Consolas,monospace;';
      root.textContent = 'IDW: sin datos (window.IDW_DATA vac\u00edo o truncado)';
      return;
    }
    root.style.background = '#0d1117';
    var data = parseData(raw);
    var nF = data.fechas.length;

    // Proyección local equirectangular (metros) — bbox fijo con todos los hitos
    var lat0 = 0;
    data.hitos.forEach(function (h) { lat0 += h.lat; });
    lat0 /= data.hitos.length;
    var mLat = 111320, mLon = 111320 * Math.cos(lat0 * Math.PI / 180);
    data.hitos.forEach(function (h) { h.x = h.lon * mLon; h.y = h.lat * mLat; });

    // ── Sparkline de evolución por hito (tooltip al pasar el ratón) ───────────
    var hById = {};
    data.hitos.forEach(function (h) { hById[h.id] = h; });
    var SPK_M = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    function dParse(s){ var p = String(s).split('/'); return new Date(+p[2], (+p[1]) - 1, +p[0]); }
    function sparkSVG(h){
      var W = 420, H = 190, mL = 44, mR = 16, mT = 28, mB = 28;
      var x0 = mL, x1 = W - mR, yb = H - mB, yt = mT;
      var pd = [];
      for (var i = 0; i <= current; i++) {
        var dz = h.serie[i];
        if (dz === null || dz === undefined || isNaN(dz)) continue;
        pd.push([dParse(data.fechas[i]).getTime(), dz]);
      }
      var t0 = pd.length ? pd[0][0] : dParse(data.fechas[0]).getTime();
      var t1 = pd.length ? pd[pd.length - 1][0] : t0 + 86400000;
      if (t1 <= t0) t1 = t0 + 86400000;
      function xs(t){ return x0 + (x1 - x0) * ((t - t0) / (t1 - t0)); }
      var vmax = 5, vmin = -15;
      function ys(v){ var c = v > vmax ? vmax : (v < vmin ? vmin : v); return yb + (yt - yb) * ((c - vmin) / (vmax - vmin)); }
      var pts = [];
      for (var pj = 0; pj < pd.length; pj++) {
        pts.push(xs(pd[pj][0]).toFixed(1) + ',' + ys(pd[pj][1]).toFixed(1));
      }
      var last = dzAt(h, current);
      var ticks = '', lastLabX = -1e9;
      var d = new Date(t0); d.setDate(1);
      while (d.getTime() <= t1) {
        if (d.getTime() >= t0) {
          var txn = xs(d.getTime());
          ticks += '<line x1="' + txn.toFixed(1) + '" y1="' + yt + '" x2="' + txn.toFixed(1) + '" y2="' + yb + '" stroke="rgba(255,255,255,.06)"/>';
          if (txn - lastLabX >= 46) {
            ticks += '<text x="' + txn.toFixed(1) + '" y="' + (yb + 15) + '" fill="#7d8590" font-size="11" text-anchor="middle">' + SPK_M[d.getMonth()] + " '" + String(d.getFullYear()).slice(2) + '</text>';
            lastLabX = txn;
          }
        }
        d.setMonth(d.getMonth() + 1);
      }
      var ygrid = '', yv2 = [5, 0, -5, -10, -15];
      for (var k = 0; k < yv2.length; k++) {
        var yv = yv2[k], yy = ys(yv).toFixed(1);
        if (yv !== 0) ygrid += '<line x1="' + x0 + '" y1="' + yy + '" x2="' + x1 + '" y2="' + yy + '" stroke="rgba(255,255,255,.05)"/>';
        ygrid += '<text x="' + (x0 - 6) + '" y="' + (ys(yv) + 3).toFixed(1) + '" fill="#7d8590" font-size="11" text-anchor="end">' + yv + '</text>';
      }
      var yz = ys(0).toFixed(1);
      return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="display:block;font-family:Segoe UI,system-ui,sans-serif;background:#161b22;border-radius:8px;">'
        + '<text x="' + x0 + '" y="18" fill="#2be2ec" font-size="15" font-weight="700">' + h.id + '</text>'
        + '<text x="' + x1 + '" y="18" fill="#e6edf3" font-size="12" text-anchor="end">Δ ' + (last == null ? '—' : last.toFixed(1) + ' mm') + '</text>'
        + ticks + ygrid
        + '<line x1="' + x0 + '" y1="' + yz + '" x2="' + x1 + '" y2="' + yz + '" stroke="#e6edf3" stroke-width="1"/>'
        + (pts.length ? '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#2be2ec" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' : '')
        + (pd.length ? '<circle cx="' + xs(pd[pd.length-1][0]).toFixed(1) + '" cy="' + ys(pd[pd.length-1][1]).toFixed(1) + '" r="2.6" fill="#2be2ec"/>' : '')
        + '</svg>';
    }

    var map = L.map(root, { zoomControl: false, attributionControl: false, maxZoom: 20 });
    L.control.zoom({ position: 'topright' }).addTo(map);
    var baseLayers = {
      sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 18 }),
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19 }),
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 17 })
    };
    var activeBase = 'sat';
    baseLayers.sat.addTo(map);
    var llBounds = L.latLngBounds(data.hitos.map(function (p) { return [p.lat, p.lon]; }));
    map.fitBounds(llBounds, { padding: [30, 30] });
    // Trazados L5 incrustados
    var trazGroup = L.featureGroup();
    TRAZADOS.forEach(function (tz) {
      L.polyline(tz.pts, { color: tz.c, weight: tz.w, opacity: 0.9, dashArray: tz.d, interactive: false }).addTo(trazGroup);
    });
    trazGroup.addTo(map);

    map.createPane('bands');
    map.getPane('bands').style.opacity = 0.78;
    map.getPane('bands').style.zIndex = 410;

    var ttStyle = document.createElement('style');
    ttStyle.textContent =
      '.idw-tt{background:#161b22!important;color:#e6edf3!important;border:1px solid #2be2ec!important;border-radius:6px!important;font-size:12px!important;padding:5px 9px!important;white-space:nowrap;}' +
      '.idw-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:#30363d;outline:none;cursor:pointer;}' +
      '.idw-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#388bfd;border:none;box-shadow:0 1px 4px rgba(0,0,0,.5);cursor:pointer;}' +
      '.idw-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#388bfd;border:none;cursor:pointer;}' +
      '.idw-btn{width:26px;height:24px;border-radius:4px;border:1px solid #30363d;background:#21262d;color:#e6edf3;font:700 12px Consolas,monospace;cursor:pointer;line-height:1;flex-shrink:0;}' +
      '.idw-btn:hover{border-color:#388bfd;color:#388bfd;}' +
      '.idw-lbtn{display:block;width:100%;text-align:left;padding:5px 9px;margin-bottom:4px;border-radius:5px;border:1px solid #30363d;background:#21262d;color:#e6edf3;font:12px Consolas,monospace;cursor:pointer;}' +
      '.idw-lbtn.active{border-color:#388bfd;color:#388bfd;background:rgba(56,139,253,.15);}' +
      '.idw-mini{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:#30363d;outline:none;cursor:pointer;width:100%;}' +
      '.idw-mini::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;border-radius:50%;background:#388bfd;border:none;cursor:pointer;}' +
      '.idw-mini::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#388bfd;border:none;cursor:pointer;}' +
      '.frente-gear{transform-origin:50% 50%;animation:gear-spin 3.5s linear infinite;}@keyframes gear-spin{to{transform:rotate(360deg);}}' +
      '.spark-tt{background:transparent!important;border:0!important;box-shadow:0 8px 28px rgba(0,0,0,.55)!important;padding:0!important;white-space:normal!important;border-radius:8px!important;}.spark-tt::before{display:none!important;}';
    document.head.appendChild(ttStyle);

    var icon = L.divIcon({
      className: '',
      html: '<svg width="11" height="11" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="4" fill="#2be2ec" stroke="rgba(0,0,0,.6)" stroke-width="1.3"/><circle cx="5.5" cy="5.5" r="1.6" fill="#fff" opacity=".75"/></svg>',
      iconSize: [11, 11], iconAnchor: [5.5, 5.5]
    });

    // ── Frentes de túnel (capa opcional; window.FRENTES) ──────────────────────
    var FRENTES = normalizeFrentes(window.FRENTES);
    function fISO(dmy){ var p = dmy.split('/'); return p[2] + '-' + p[1] + '-' + p[0]; }
    function frenteIcon(name, color){
      var s = 36, teeth = '';
      for (var a = 0; a < 360; a += 45) {
        teeth += '<rect x="-3.4" y="-29" width="6.8" height="11" rx="1.5" transform="rotate(' + a + ')"/>';
      }
      return L.divIcon({ className: '',
        html: '<svg width="' + s + '" height="' + s + '" viewBox="-30 -30 60 60" class="frente-gear" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.7));">'
          + '<g fill="' + color + '" stroke="#111" stroke-width="1">' + teeth + '<circle r="20"/></g>'
          + '<circle r="7.5" fill="#1a1a1a" stroke="#000" stroke-width="1"/></svg>',
        iconSize: [s, s], iconAnchor: [s / 2, s / 2], popupAnchor: [0, -s / 2] });
    }

    var bandGroup = null, hitoGroup = null, frenteGroup = null;
    var frentesOn = true;
    // Parámetros de interpolación (ajustables desde el panel)
    var interpMode = 'accum';   // 'accum' = última medición ≤ fecha | 'exact' = solo hitos medidos esa fecha
    var idwPower = 2;           // exponente IDW (QGIS usa 2 por defecto)
    var EXT_PAD = 40;           // margen del ráster alrededor de los puntos (m)
    var MAX_CELLS = 200000;     // tope de celdas (celda adaptativa)
    var CLUSTER_DIST = 250;     // distancia máx (m) para agrupar hitos en una misma superficie
    var idwReach = 120;         // alcance (m): más allá, terreno estable (0 mm)

    // Agrupa puntos en cúmulos espaciales (unión por cercanía < CLUSTER_DIST)
    function clusterPts(pts, dist) {
      var d2max = dist * dist, clusters = [];
      var assigned = new Array(pts.length);
      for (var i = 0; i < pts.length; i++) assigned[i] = -1;
      for (var s = 0; s < pts.length; s++) {
        if (assigned[s] >= 0) continue;
        var idc = clusters.length, stack = [s], cl = [pts[s]];
        assigned[s] = idc;
        while (stack.length) {
          var a = stack.pop();
          for (var j = 0; j < pts.length; j++) {
            if (assigned[j] >= 0) continue;
            var dx = pts[a].x - pts[j].x, dy = pts[a].y - pts[j].y;
            if (dx * dx + dy * dy <= d2max) { assigned[j] = idc; cl.push(pts[j]); stack.push(j); }
          }
        }
        clusters.push(cl);
      }
      return clusters;
    }

    function tooltip(fecha, lo, hi) {
      return '<div style="font-family:Consolas,monospace;font-size:11px;min-width:150px;">'
        + '<div style="display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #30363d;padding-bottom:3px;margin-bottom:3px;"><span style="color:#7d8590;">Fecha</span><b>' + fecha + '</b></div>'
        + '<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:#7d8590;">Δ Cota mín</span><b>' + lo.toFixed(2) + ' mm</b></div>'
        + '<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:#7d8590;">Δ Cota máx</span><b>' + hi.toFixed(2) + ' mm</b></div>'
        + '</div>';
    }

    function update(idx) {
      var fecha = data.fechas[idx];
      var pts = [];
      data.hitos.forEach(function (h) {
        var dz = interpMode === 'exact' ? h.serie[idx] : dzAt(h, idx);
        if (dz !== null && dz !== undefined && !isNaN(dz)) pts.push({ id: h.id, lat: h.lat, lon: h.lon, x: h.x, y: h.y, dz: dz });
      });
      if (bandGroup) { map.removeLayer(bandGroup); bandGroup = null; }
      if (hitoGroup) { map.removeLayer(hitoGroup); hitoGroup = null; }
      if (frenteGroup) { map.removeLayer(frenteGroup); frenteGroup = null; }
      if (FRENTES && frentesOn) {
        var curISO = fISO(fecha);
        frenteGroup = L.featureGroup();
        Object.keys(FRENTES).forEach(function (fn) {
          var fr = FRENTES[fn], pos = null;
          for (var pi = 0; pi < fr.pos.length; pi++) { if (fr.pos[pi][0] <= curISO) pos = fr.pos[pi]; else break; }
          if (!pos) return;
          L.marker([pos[1], pos[2]], { icon: frenteIcon(fn, fr.color), zIndexOffset: 1000 })
            .bindTooltip('<b style="color:' + fr.color + '">\u2699 Frente ' + fn + '</b><br>PK: <b>' + pos[3] + '</b><br>Fecha posici\u00f3n: <b>' + pos[0] + '</b>', { className: 'idw-tt', direction: 'top', offset: [0, -10] })
            .addTo(frenteGroup);
        });
        frenteGroup.addTo(map);
      }
      if (!pts.length) return;

      bandGroup = L.featureGroup();

      // Una superficie IDW independiente por cúmulo de hitos (como los ráster de QGIS)
      clusterPts(pts, CLUSTER_DIST).forEach(function (cpts) {
        if (cpts.length < 3) return;
        renderSurface(cpts, fecha);
      });
      bandGroup.addTo(map);

      hitoGroup = L.featureGroup();
      pts.forEach(function (p) {
        var _h = hById[p.id];
        L.marker([p.lat, p.lon], { icon: icon })
          .bindTooltip(function () { return sparkSVG(_h); }, { direction: 'top', offset: [0, -8], className: 'spark-tt', sticky: false })
          .addTo(hitoGroup);
      });
      hitoGroup.addTo(map);
    }

    function renderSurface(pts, fecha) {
      // Extensión local: bbox de los puntos del cúmulo + margen
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var EXT = Math.max(EXT_PAD, idwReach + 20);
      var bbox = {
        w: Math.min.apply(null, xs) - EXT, e: Math.max.apply(null, xs) + EXT,
        s: Math.min.apply(null, ys) - EXT, n: Math.max.apply(null, ys) + EXT
      };
      // Celda adaptativa: parte de CELL y crece si la malla supera MAX_CELLS
      var cell = CELL;
      var W = Math.max(8, Math.round((bbox.e - bbox.w) / cell));
      var H = Math.max(8, Math.round((bbox.n - bbox.s) / cell));
      if (W * H > MAX_CELLS) {
        cell *= Math.sqrt(W * H / MAX_CELLS);
        W = Math.max(8, Math.round((bbox.e - bbox.w) / cell));
        H = Math.max(8, Math.round((bbox.n - bbox.s) / cell));
      }
      var PW = W + 2, PH = H + 2;
      var xSpan = bbox.e - bbox.w, ySpan = bbox.n - bbox.s;
      function gToLL(pt) {
        var xm = bbox.w + xSpan * (pt[0] - 1) / (W - 1);
        var ym = bbox.n - ySpan * (pt[1] - 1) / (H - 1);
        return [ym / mLat, xm / mLon];
      }

      var grid = computeGrid(pts, bbox, W, H, idwPower, idwReach);
      var pg = new Float64Array(PW * PH);
      for (var r = 0; r < H; r++) pg.set(grid.subarray(r * W, r * W + W), (r + 1) * PW + 1);

      var mn = 0, mx = 0;
      for (var i = 0; i < grid.length; i++) { if (grid[i] < mn) mn = grid[i]; if (grid[i] > mx) mx = grid[i]; }
      var minInt = Math.max(-30, Math.floor(mn)), maxInt = Math.min(30, Math.ceil(mx));

      var jobs = [];
      NEG_LEVELS.forEach(function (b, i2) {
        if (minInt >= b.level) return;
        var next = NEG_LEVELS[i2 + 1];
        jobs.push({ level: b.level, invert: true, color: b.color, deep: !!b.deep, lo: next ? next.level : Math.min(mn, b.level), hi: b.level });
      });
      POS_LEVELS.forEach(function (b, i2) {
        if (maxInt <= b.level) return;
        var next = POS_LEVELS[i2 + 1];
        jobs.push({ level: b.level, invert: false, color: b.color, deep: false, lo: b.level, hi: next ? next.level : Math.max(mx, b.level) });
      });

      jobs.forEach(function (job) {
        var segs;
        if (job.invert) {
          var neg = new Float64Array(PW * PH);
          for (var k = 0; k < neg.length; k++) neg[k] = -pg[k];
          segs = marchingSegs(neg, PW, PH, -job.level);
        } else {
          segs = marchingSegs(pg, PW, PH, job.level);
        }
        var rings = stitchRings(segs).filter(function (rg) { return rg.length > 3; });
        if (!rings.length) return;
        L.polygon(rings.map(function (rg) { return rg.map(gToLL); }), {
          pane: 'bands', smoothFactor: job.deep ? 0 : 1,
          fillColor: 'rgb(' + job.color + ')', fillOpacity: 1, fillRule: 'evenodd',
          color: 'rgb(35,35,35)', weight: 0.6, opacity: 0.55
        }).bindTooltip(tooltip(fecha, job.lo, job.hi), { sticky: true, className: 'idw-tt', direction: 'top' })
          .addTo(bandGroup);
      });
    }

    // Badge de fecha (arriba-dcha) — solo cuando no hay slider
    var badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:10px;left:186px;z-index:1000;font:700 14px Consolas,monospace;color:#388bfd;background:rgba(22,27,34,.92);border:1px solid #388bfd;border-radius:99px;padding:4px 14px;';
    if (nF > 1) badge.style.display = 'none';
    root.appendChild(badge);

    var current = nF - 1;
    var pending = null, timer = null;
    var syncUI = function () {};
    function requestUpdate(idx) {
      current = idx;
      badge.textContent = data.fechas[idx];
      syncUI();
      pending = idx;
      if (timer) return;
      timer = setTimeout(function () {
        timer = null;
        update(pending);
      }, 120);
    }

    // Barra de fechas (solo si hay más de una)
    if (nF > 1) {
      var bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:207px;right:10px;bottom:10px;z-index:1000;display:flex;align-items:center;gap:14px;background:rgba(13,17,23,.92);border:1px solid #30363d;border-radius:6px;padding:8px 14px;font-family:Consolas,monospace;box-shadow:0 4px 16px rgba(0,0,0,.45);';
      var lab0 = document.createElement('span');
      lab0.textContent = data.fechas[0];
      lab0.style.cssText = 'font-size:12px;color:#e6edf3;flex-shrink:0;';
      var range = document.createElement('input');
      range.type = 'range'; range.min = 0; range.max = nF - 1; range.step = 1; range.value = nF - 1;
      range.className = 'idw-range';
      range.style.cssText = 'flex:1;min-width:80px;';
      var lab1 = document.createElement('span');
      lab1.textContent = data.fechas[nF - 1];
      lab1.style.cssText = 'font-size:12px;color:#7d8590;flex-shrink:0;';
      var count = document.createElement('span');
      count.style.cssText = 'font-size:12px;color:#7d8590;flex-shrink:0;';
      var prev = document.createElement('button');
      prev.textContent = '‹'; prev.className = 'idw-btn';
      var next = document.createElement('button');
      next.textContent = '›'; next.className = 'idw-btn';
      var cur = document.createElement('span');
      cur.style.cssText = 'font:700 13px Consolas,monospace;color:#388bfd;flex-shrink:0;';
      bar.appendChild(lab0); bar.appendChild(range); bar.appendChild(lab1);
      bar.appendChild(count); bar.appendChild(prev); bar.appendChild(next); bar.appendChild(cur);
      root.appendChild(bar);

      syncUI = function () {
        var p = nF > 1 ? current / (nF - 1) * 100 : 100;
        range.value = current;
        range.style.background = 'linear-gradient(to right,#388bfd 0%,#388bfd ' + p + '%,#30363d ' + p + '%,#30363d 100%)';
        count.textContent = (current + 1) + ' / ' + nF;
        cur.textContent = data.fechas[current];
      };

      range.addEventListener('input', function () { requestUpdate(+range.value); });
      prev.addEventListener('click', function () { if (current > 0) requestUpdate(current - 1); });
      next.addEventListener('click', function () { if (current < nF - 1) requestUpdate(current + 1); });

      // Evitar que arrastrar el slider mueva el mapa
      L.DomEvent.disableClickPropagation(bar);
      syncUI();
    }

    // ── Panel de control (Reproductor · Capas base · IDW) ────────────────
    var panel = document.createElement('div');
    panel.style.cssText = 'position:absolute;top:0;bottom:0;left:0;z-index:1000;width:172px;overflow-y:auto;background:rgba(13,17,23,.94);border-right:1px solid #30363d;padding:12px;font-family:Consolas,monospace;color:#e6edf3;box-shadow:4px 0 16px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:12px;';
    function section(title) {
      var s = document.createElement('div');
      var h = document.createElement('div');
      h.textContent = title;
      h.style.cssText = 'font:700 10px Consolas,monospace;letter-spacing:.08em;color:#7d8590;text-transform:uppercase;margin-bottom:6px;';
      s.appendChild(h);
      return s;
    }

    // Reproductor (solo con más de una fecha)
    if (nF > 1) {
      var speed = 800, playing = null;
      var sRep = section('Reproductor');
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;';
      var playBtn = document.createElement('button');
      playBtn.textContent = '▶';
      playBtn.className = 'idw-btn';
      var spd = document.createElement('input');
      spd.type = 'range'; spd.min = 200; spd.max = 2000; spd.step = 100; spd.value = speed;
      spd.className = 'idw-mini'; spd.style.flex = '1';
      var spdVal = document.createElement('span');
      spdVal.textContent = speed + 'ms';
      spdVal.style.cssText = 'font-size:10px;color:#388bfd;min-width:44px;text-align:right;';
      var stopPlay = function () { clearInterval(playing); playing = null; playBtn.textContent = '▶'; };
      var startPlay = function () {
        playBtn.textContent = '❚❚';
        playing = setInterval(function () {
          requestUpdate(current >= nF - 1 ? 0 : current + 1);
        }, speed);
      };
      playBtn.addEventListener('click', function () { if (playing) stopPlay(); else startPlay(); });
      spd.addEventListener('input', function () {
        speed = +spd.value; spdVal.textContent = speed + 'ms';
        if (playing) { clearInterval(playing); playing = setInterval(function () { requestUpdate(current >= nF - 1 ? 0 : current + 1); }, speed); }
      });
      row.appendChild(playBtn); row.appendChild(spd); row.appendChild(spdVal);
      sRep.appendChild(row);
      panel.appendChild(sRep);
    }

    // Capas base
    var sBase = section('Capas base');
    var baseNames = { sat: '🛰 Satélite', osm: '🗺 Calles', topo: '⛰ Topográfico' };
    var baseBtns = {};
    Object.keys(baseNames).forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'idw-lbtn' + (k === activeBase ? ' active' : '');
      b.textContent = baseNames[k];
      b.addEventListener('click', function () {
        if (k === activeBase) return;
        map.removeLayer(baseLayers[activeBase]);
        baseLayers[k].addTo(map);
        baseBtns[activeBase].classList.remove('active');
        activeBase = k;
        b.classList.add('active');
      });
      baseBtns[k] = b;
      sBase.appendChild(b);
    });
    panel.appendChild(sBase);

    // Capas de datos: trazados
    var sTraz = section('Capas de datos');
    var tzBtn = document.createElement('button');
    tzBtn.className = 'idw-lbtn active';
    tzBtn.textContent = '\ud83d\udcd0 Trazados L5';
    var tzOn = true;
    tzBtn.addEventListener('click', function () {
      tzOn = !tzOn;
      if (tzOn) trazGroup.addTo(map); else map.removeLayer(trazGroup);
      tzBtn.classList.toggle('active', tzOn);
    });
    sTraz.appendChild(tzBtn);
    if (FRENTES) {
      var frBtn = document.createElement('button');
      frBtn.className = 'idw-lbtn active';
      frBtn.textContent = '\u2699 Frentes t\u00fanel';
      frBtn.addEventListener('click', function () {
        frentesOn = !frentesOn;
        frBtn.classList.toggle('active', frentesOn);
        update(current);
      });
      sTraz.appendChild(frBtn);
    }
    panel.appendChild(sTraz);

    // Interpolación: modo + exponente
    var sInt = section('Interpolación');
    var mExact = document.createElement('button');
    mExact.className = 'idw-lbtn';
    mExact.textContent = 'Fecha exacta';
    mExact.title = 'Solo hitos medidos en la fecha seleccionada (como QGIS)';
    var mAccum = document.createElement('button');
    mAccum.className = 'idw-lbtn active';
    mAccum.textContent = 'Acumulado';
    mAccum.title = 'Última medición de cada hito hasta la fecha seleccionada';
    function setMode(m) {
      if (interpMode === m) return;
      interpMode = m;
      mExact.classList.toggle('active', m === 'exact');
      mAccum.classList.toggle('active', m === 'accum');
      update(current);
    }
    mExact.addEventListener('click', function () { setMode('exact'); });
    mAccum.addEventListener('click', function () { setMode('accum'); });
    var pRow = document.createElement('div');
    pRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:2px;';
    var pLab = document.createElement('span');
    pLab.textContent = 'Exp.';
    pLab.style.cssText = 'font-size:10px;color:#7d8590;';
    var pw = document.createElement('input');
    pw.type = 'range'; pw.min = 1; pw.max = 4; pw.step = 0.5; pw.value = idwPower;
    pw.className = 'idw-mini'; pw.style.flex = '1';
    var pwVal = document.createElement('span');
    pwVal.textContent = idwPower.toFixed(1);
    pwVal.style.cssText = 'font-size:10px;color:#388bfd;min-width:26px;text-align:right;';
    pw.addEventListener('change', function () {
      idwPower = +pw.value; pwVal.textContent = idwPower.toFixed(1);
      update(current);
    });
    pw.addEventListener('input', function () { pwVal.textContent = (+pw.value).toFixed(1); });
    pRow.appendChild(pLab); pRow.appendChild(pw); pRow.appendChild(pwVal);
    var rRow = document.createElement('div');
    rRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:6px;';
    var rLab = document.createElement('span');
    rLab.textContent = 'Alcance';
    rLab.style.cssText = 'font-size:10px;color:#7d8590;';
    var rc = document.createElement('input');
    rc.type = 'range'; rc.min = 40; rc.max = 400; rc.step = 20; rc.value = idwReach;
    rc.className = 'idw-mini'; rc.style.flex = '1';
    var rcVal = document.createElement('span');
    rcVal.textContent = idwReach + 'm';
    rcVal.style.cssText = 'font-size:10px;color:#388bfd;min-width:36px;text-align:right;';
    rc.addEventListener('input', function () { rcVal.textContent = rc.value + 'm'; });
    rc.addEventListener('change', function () {
      idwReach = +rc.value;
      update(current);
    });
    rRow.appendChild(rLab); rRow.appendChild(rc); rRow.appendChild(rcVal);
    sInt.appendChild(mAccum); sInt.appendChild(mExact); sInt.appendChild(pRow); sInt.appendChild(rRow);
    panel.appendChild(sInt);

    // IDW: toggle + opacidad
    var sIdw = section('IDW Cotas');
    var tgl = document.createElement('button');
    tgl.className = 'idw-lbtn active';
    tgl.textContent = '🌡 Bandas IDW';
    var idwOn = true;
    tgl.addEventListener('click', function () {
      idwOn = !idwOn;
      map.getPane('bands').style.display = idwOn ? '' : 'none';
      tgl.classList.toggle('active', idwOn);
    });
    var oRow = document.createElement('div');
    oRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:2px;';
    var oLab = document.createElement('span');
    oLab.textContent = 'Opac.';
    oLab.style.cssText = 'font-size:10px;color:#7d8590;';
    var op = document.createElement('input');
    op.type = 'range'; op.min = 0; op.max = 100; op.step = 1; op.value = 78;
    op.className = 'idw-mini'; op.style.flex = '1';
    var opVal = document.createElement('span');
    opVal.textContent = '78%';
    opVal.style.cssText = 'font-size:10px;color:#388bfd;min-width:32px;text-align:right;';
    op.addEventListener('input', function () {
      map.getPane('bands').style.opacity = op.value / 100;
      opVal.textContent = op.value + '%';
    });
    oRow.appendChild(oLab); oRow.appendChild(op); oRow.appendChild(opVal);
    // Leyenda Δ Cota (mm) — misma que index.html
    var lg = document.createElement('div');
    lg.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:3px;';
    [
      ['rgb(40,0,0)', '≤ −14 (subsidencia)'],
      ['rgb(80,0,0)', '−10'],
      ['rgb(180,30,20)', '−8'],
      ['rgb(230,100,30)', '−6'],
      ['rgb(245,180,50)', '−4'],
      [null, '−2 a +2 (estable)'],
      ['rgb(158,202,225)', '+4'],
      ['rgb(107,174,214)', '+6'],
      ['rgb(66,146,198)', '+8'],
      ['rgb(33,113,181)', '+10'],
      ['rgb(8,48,107)', '≥ +14 (alzamiento)']
    ].forEach(function (rowDef) {
      var lr = document.createElement('div');
      lr.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:10px;color:#e6edf3;';
      var sw = document.createElement('span');
      sw.style.cssText = 'width:20px;height:11px;border-radius:2px;flex-shrink:0;opacity:.85;'
        + (rowDef[0] ? 'background:' + rowDef[0] + ';' : 'background:transparent;border:1px dashed #6e7681;');
      var tx = document.createElement('span');
      tx.textContent = rowDef[1];
      lr.appendChild(sw); lr.appendChild(tx);
      lg.appendChild(lr);
    });
    sIdw.appendChild(tgl); sIdw.appendChild(oRow); sIdw.appendChild(lg);
    panel.appendChild(sIdw);
    var verEl = document.createElement('div');
    verEl.textContent = 'motor ' + VERSION;
    verEl.style.cssText = 'margin-top:auto;font-size:9px;color:#484f58;text-align:right;';
    panel.appendChild(verEl);
    root.appendChild(panel);
    L.DomEvent.disableClickPropagation(panel);

    // Diagnóstico: aviso si no hay ninguna medición válida
    var totalMed = 0;
    data.hitos.forEach(function (h) { h.serie.forEach(function (s) { if (s !== null) totalMed++; }); });
    if (!totalMed) {
      var warnEl = document.createElement('div');
      warnEl.textContent = '\u26a0 ' + data.hitos.length + ' hitos pero 0 mediciones v\u00e1lidas \u2014 revisa la columna \u0394 COTAA (mm) en la medida';
      warnEl.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:1000;font:600 12px Consolas,monospace;color:#f0b429;background:rgba(22,27,34,.94);border:1px solid #f0b429;border-radius:8px;padding:6px 14px;';
      root.appendChild(warnEl);
    }

    badge.textContent = data.fechas[current];
    update(current);
  }

  loadLeaflet(render);
})();
