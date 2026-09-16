from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
import io
out=Path('tests/fixtures')
rows=[('1','IT 23 3616 90','71.5'),('2','IT24100007','82.75'),('3','IT 24 1000 12','62'),('4','IT 01 0002 03','0'),('5','IT-24-1000-15','82.75'),('6','IT 24 1000 16','100')]
c=canvas.Canvas(str(out/'digital.pdf'))
for page in range(2):
    c.setFont('Helvetica-Bold',16);c.drawString(55,780,'Synthetic examination results')
    c.setFont('Helvetica',12);c.drawString(55,746,'Row');c.drawString(130,746,'Registration number');c.drawString(400,746,'Assessment mark')
    for i,r in enumerate(rows[page*3:page*3+3]):
        for x,value in zip([55,130,400],r):c.drawString(x,700-i*35,value)
    c.drawString(55,80,'Signature: Test Examiner');c.drawString(440,45,f'Page {page+1} of 2');c.showPage()
c.save()
im=Image.new('RGB',(1654,2339),'white');d=ImageDraw.Draw(im)
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',35)
d.text((120,160),'Synthetic scanned results',font=font,fill='black')
for i,row in enumerate([('Row','Registration number','Mark'),('1','IT 24 1000 07','82.75'),('2','IT 24 1000 12','62'),('3','IT 01 0002 03','0')]):
    for x,value in zip([120,350,1200],row):d.text((x,320+i*95),value,font=font,fill='black')
buffer=io.BytesIO();im.save(buffer,format='PNG');buffer.seek(0)
c=canvas.Canvas(str(out/'scanned.pdf'));c.drawImage(ImageReader(buffer),0,0,width=595.27,height=841.89);c.save()
im.resize((827,1170)).save('/tmp/markwise-scan-fixture.png')
r=PdfReader(out/'digital.pdf');w=PdfWriter();w.append_pages_from_reader(r);w.encrypt('test-password');w.write(out/'protected.pdf')
(out/'invalid.pdf').write_text('This is not a PDF. Synthetic invalid-file fixture.')
print('Created digital, scanned, password-protected, and invalid fixtures.')
