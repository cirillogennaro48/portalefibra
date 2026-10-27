def parse_sertori_raw(text):
    lavori=[]
    for line in text.splitlines():
        if not line.strip(): continue
        # Cerca righe che hanno VIA / CSO / CANTONI ecc
        if "VIA" in line or "CSO" in line or "CORSO" in line:
            # Spezza per tab o doppi spazi
            parts = re.split(r'\t+|\s{2,}', line)
            # Cerca il pezzo con VIA
            for i,p in enumerate(parts):
                if p.strip().startswith("VIA") or "CANTONI" in p or "GALLARATE" in p or "BUENOS" in p:
                    indirizzo = p.strip()
                    cliente = parts[i-1].strip() if i>0 else ""
                    # pulisci cliente
                    cliente = re.sub(r'[^A-Z\s\.]','', cliente.upper()).strip()
                    if len(cliente)>2 and "CANTIERE" not in cliente and "MILANO" not in cliente and "MI/FCO" not in cliente:
                        lavori.append({"cliente":cliente.title(), "indirizzo":indirizzo.title(), "comune":"Milano"})
    # Se non trova con tab, prova il metodo vecchio per il tuo incolla
    if not lavori:
        # Cerca direttamente nel testo gigante
        for m in re.finditer(r'([A-Z ]{4,30})\s+(VIA [A-Z0-9 ]+?\d+)', text):
            c = m.group(1).strip()
            if len(c)>3 and "CANTIERE" not in c and "ASS_" not in c:
                lavori.append({"cliente":c.title(), "indirizzo":m.group(2).title(), "comune":"Milano"})
    return lavori
