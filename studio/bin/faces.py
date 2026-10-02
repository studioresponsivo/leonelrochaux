# Centro do rosto (x) a cada 0.5s em cada trecho. Uso: faces.py <video> <req.json [[in,out],...]>  → JSON [[ [t,x], ...], ...]
import cv2, json, sys
cap = cv2.VideoCapture(sys.argv[1])
casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
out = []
for a, b in json.load(open(sys.argv[2])):
    pts, t = [], a
    while t < b:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, fr = cap.read()
        if ok:
            g = cv2.cvtColor(cv2.resize(fr, (960, 540)), cv2.COLOR_BGR2GRAY)
            f = casc.detectMultiScale(g, 1.1, 6, minSize=(90, 90))
            if len(f):
                x, y, w, h = max(f, key=lambda r: r[2] * r[3])
                pts.append([round(t, 2), int((x + w / 2) * 2)])
        t += 0.5
    out.append(pts)
print(json.dumps(out))
